import { test } from 'node:test'
import { deepStrictEqual, rejects, strictEqual } from 'node:assert/strict'
import { encodeForm, signStripePayload, stripeConfig, stripeLocale, stripePost, stripeProblems, verifyStripeSignature } from './stripe'

const SECRET = 'whsec_unit'
const BODY = '{"type":"checkout.session.completed","data":{"object":{"id":"cs_1"}}}'
const NOW = 1_800_000_000

test('forms are encoded the way Stripe reads nested fields', () => {
  strictEqual(encodeForm({ mode: 'subscription', line_items: [{ price: 'price_1', quantity: 1 }], metadata: { plan: 'pro' } }), 'mode=subscription&line_items[0][price]=price_1&line_items[0][quantity]=1&metadata[plan]=pro')
  strictEqual(encodeForm({ a: undefined, b: null, c: false, d: 0 }), 'c=false&d=0', 'empty values are skipped, false and 0 are kept')
  strictEqual(encodeForm({ url: 'https://x.test/a?b=1&c=2#f' }), 'url=https%3A%2F%2Fx.test%2Fa%3Fb%3D1%26c%3D2%23f', 'values are escaped')
})

test('a correctly signed body passes', () => {
  strictEqual(verifyStripeSignature(BODY, signStripePayload(BODY, SECRET, NOW), SECRET, NOW), true)
  strictEqual(verifyStripeSignature(Buffer.from(BODY), signStripePayload(BODY, SECRET, NOW), SECRET, NOW), true, 'the raw Buffer is checked the same way')
})

test('a changed body, another secret or a missing or broken header fails', () => {
  const header = signStripePayload(BODY, SECRET, NOW)
  strictEqual(verifyStripeSignature(BODY + ' ', header, SECRET, NOW), false)
  strictEqual(verifyStripeSignature(BODY, header, 'whsec_other', NOW), false)
  strictEqual(verifyStripeSignature(BODY, undefined, SECRET, NOW), false)
  strictEqual(verifyStripeSignature(BODY, '', SECRET, NOW), false)
  strictEqual(verifyStripeSignature(BODY, 't=abc,v1=00', SECRET, NOW), false)
  strictEqual(verifyStripeSignature(BODY, `t=${NOW}`, SECRET, NOW), false, 'no v1 signature')
  strictEqual(verifyStripeSignature(BODY, `t=${NOW},v1=zz`, SECRET, NOW), false, 'not hex')
  strictEqual(verifyStripeSignature(BODY, header, '', NOW), false, 'no secret configured')
})

test('the timestamp must be within five minutes, so a captured request cannot be replayed later', () => {
  const header = signStripePayload(BODY, SECRET, NOW)
  strictEqual(verifyStripeSignature(BODY, header, SECRET, NOW + 299), true)
  strictEqual(verifyStripeSignature(BODY, header, SECRET, NOW + 301), false)
  strictEqual(verifyStripeSignature(BODY, header, SECRET, NOW - 301), false)
})

test('several v1 signatures (a rotated secret) are accepted when one of them matches', () => {
  const good = signStripePayload(BODY, SECRET, NOW).split(',')[1]
  strictEqual(verifyStripeSignature(BODY, `t=${NOW},v1=${'0'.repeat(64)},${good}`, SECRET, NOW), true)
})

test('the configuration comes from the environment, and empty values mean not configured', () => {
  const c = stripeConfig({ STRIPE_SECRET_KEY: '', STRIPE_PRICE_PRO: 'price_1', STRIPE_API_BASE: 'http://localhost:1/' })
  strictEqual(c.secretKey, undefined)
  strictEqual(c.prices.pro, 'price_1')
  strictEqual(c.prices.premium, undefined)
  strictEqual(c.apiBase, 'http://localhost:1')
  strictEqual(stripeConfig({}).apiBase, 'https://api.stripe.com')
})

test('stripePost sends the key and the form, and turns a Stripe error into a StripeError', async () => {
  let seen: { url: string; init: RequestInit } | undefined
  const ok = async (url: string | URL | Request, init?: RequestInit) => ((seen = { url: String(url), init: init! }), new Response(JSON.stringify({ url: 'https://pay' }), { status: 200 }))
  const cfg = stripeConfig({ STRIPE_SECRET_KEY: 'sk_test_1', STRIPE_API_BASE: 'http://stripe.test' })
  deepStrictEqual(await stripePost(cfg, '/v1/x', { a: { b: 1 } }, ok as typeof fetch), { url: 'https://pay' })
  strictEqual(seen!.url, 'http://stripe.test/v1/x')
  strictEqual((seen!.init.headers as Record<string, string>).Authorization, 'Bearer sk_test_1')
  strictEqual(seen!.init.body, 'a[b]=1')
  const declined = async () => new Response(JSON.stringify({ error: { message: 'Card declined' } }), { status: 402 })
  await rejects(stripePost(cfg, '/v1/x', {}, declined as typeof fetch), { message: 'Card declined', status: 402 })
  await rejects(stripePost(stripeConfig({}), '/v1/x', {}), { status: 503 })
})

test('Stripe has no Ukrainian checkout language: we ask for auto instead of a locale it would reject', () => {
  strictEqual(stripeLocale('en'), 'en')
  strictEqual(stripeLocale('uk'), 'auto')
  strictEqual(stripeLocale('xx'), 'auto')
})

test('the configuration check names what is wrong, never the secret itself', () => {
  const good = stripeConfig({ STRIPE_SECRET_KEY: 'sk_test_abc', STRIPE_PRICE_PRO: 'price_1', STRIPE_PRICE_PREMIUM: 'price_2', STRIPE_WEBHOOK_SECRET: 'whsec_x' })
  deepStrictEqual(stripeProblems(good), [])
  const bad = stripeConfig({ STRIPE_SECRET_KEY: 'sk_test_SUPERSECRET', STRIPE_PRICE_PRO: 'prod_123', STRIPE_PRICE_PREMIUM: '', STRIPE_WEBHOOK_SECRET: '' })
  const text = stripeProblems(bad).join(' | ')
  strictEqual(/product id/.test(text) && /STRIPE_PRICE_PREMIUM is empty/.test(text) && /STRIPE_WEBHOOK_SECRET is empty/.test(text), true, text)
  strictEqual(text.includes('SUPERSECRET'), false)
  strictEqual(stripeProblems(stripeConfig({})).length, 4)
})
