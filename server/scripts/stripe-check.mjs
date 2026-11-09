// Перевірка оплати проти справжнього Stripe (тестового режиму): npm run build && node --env-file=.env scripts/stripe-check.mjs [--session]
// Без прапорця лише читає (нічого не створює): ключ, режим, обидва Price. З --session створює сесію Stripe Checkout у тестовому
// режимі й друкує посилання: відкрийте його й оплатіть тестовою карткою 4242 4242 4242 4242 (будь-яка майбутня дата й CVC).
// Ключі беруться з .env (STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_PREMIUM, STRIPE_WEBHOOK_SECRET); у вивід вони не потрапляють.
import { encodeForm } from '../dist/billing/stripe.js'

const key = process.env.STRIPE_SECRET_KEY
const base = (process.env.STRIPE_API_BASE || 'https://api.stripe.com').replace(/\/$/, '')
let failed = 0
const check = (name, ok, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` ${extra}`}`)
}

if (!key) {
  console.log('STRIPE_SECRET_KEY is not set in server/.env: see the Stripe block in .env.example')
  process.exit(1)
}
check('key looks like a Stripe secret key', /^(sk|rk)_(test|live)_/.test(key))
check('TEST mode (a live key must not be used for checks)', key.includes('_test_'), 'the key is a live one: stop and use a test key')
if (!key.includes('_test_')) process.exit(1)

const call = async (method, path, params) => {
  const res = await fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${key}`, ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: params ? encodeForm(params) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => null) }
}

const me = await call('GET', '/v1/balance')
check('the key is accepted by Stripe', me.status === 200, `(HTTP ${me.status}: ${me.data?.error?.message})`)
check('the account is in test mode', me.data?.livemode === false)

for (const [plan, env] of [['pro', 'STRIPE_PRICE_PRO'], ['premium', 'STRIPE_PRICE_PREMIUM']]) {
  const id = process.env[env]
  if (!id) {
    check(`${env} is set`, false)
    continue
  }
  const r = await call('GET', `/v1/prices/${encodeURIComponent(id)}`)
  check(`${plan}: the Price exists`, r.status === 200, `(HTTP ${r.status}: ${r.data?.error?.message})`)
  if (r.status !== 200) continue
  check(`${plan}: the Price is active`, r.data.active === true)
  check(`${plan}: the Price is recurring (a subscription)`, r.data.type === 'recurring', `(type: ${r.data.type})`)
  console.log(`     ${plan}: ${(r.data.unit_amount ?? 0) / 100} ${String(r.data.currency).toUpperCase()} every ${r.data.recurring?.interval}`)
}
check('STRIPE_WEBHOOK_SECRET looks like a webhook secret', /^whsec_/.test(process.env.STRIPE_WEBHOOK_SECRET ?? ''), '(from `stripe listen` or the webhook endpoint page)')

if (process.argv.includes('--session') && !failed) {
  const price = process.env.STRIPE_PRICE_PRO
  const app = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')
  const s = await call('POST', '/v1/checkout/sessions', {
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: `${app}/app.html#/pricing?checkout=success`,
    cancel_url: `${app}/app.html#/pricing?checkout=cancelled`,
    client_reference_id: '00000000-0000-4000-8000-000000000000',
    metadata: { userId: '00000000-0000-4000-8000-000000000000', plan: 'pro' },
  })
  check('a test Checkout session is created', s.status === 200 && !!s.data?.url, `(HTTP ${s.status}: ${s.data?.error?.message})`)
  if (s.data?.url) console.log(`\nOpen this link and pay with the test card 4242 4242 4242 4242:\n${s.data.url}\n(the user id in it is a dummy: the webhook will find no such user and ignore it)`)
}

console.log(failed ? `\n${failed} problem(s)` : '\nStripe configuration is fine')
process.exit(failed ? 1 : 0)
