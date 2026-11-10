// Екрани без складних оверлеїв: Dashboard, Pricing, Register, Tarot Studio.
import { get, getToken, post } from '../../lib/api.js'
import { register } from '../../lib/auth.js'
import { greeting } from '../format.js'
import { t } from '../../i18n/index.js'
import { saveCurrentLanguage } from '../../i18n/sync.js'
import { session } from './common.js'
import { hashParam } from '../../lib/hashParam.js'
import { say } from '../toast.js'
import { Ov } from './parts.jsx'

// ---------- Dashboard ----------
// У плиті намальована смужка прогресу завжди заповнена на 72 %: закриваємо її власною (трек 1119–1474 x 739–762)
const TRACK = [1119, 739, 355, 23, 11.5]

export const dashboard = {
  Under: ({ ctx }) => {
    const pct = parseInt(ctx.values.progress ?? '0', 10) || 0
    return (
      <Ov at={TRACK} className="ov-none" style={{ background: 'rgb(43,53,65)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #f3ae5a, #fecf78)' }} />
      </Ov>
    )
  },
  bind: [
    { find: 'Good evening,', key: 'greeting' },
    { find: 'Julia', key: 'name' },
    { find: 'A time for self-discovery, new', lines: 2, key: 'insight' },
    { find: '12', key: 'readings' },
    { find: '5', key: 'dreams' },
    { find: '8', key: 'journal' },
    { find: '24', key: 'chats' },
    { find: '72%', key: 'progress' },
  ],
  actions: { 'Monthly Insight': (ctx) => ctx.go('/today') },
  async load() {
    const d = await get('/dashboard')
    return {
      values: {
        greeting: t(greeting()),
        name: d.name,
        insight: d.insight,
        readings: d.counts.readings,
        dreams: d.counts.dreams,
        journal: d.counts.journal,
        chats: d.counts.chats,
        progress: `${d.progress}%`,
      },
    }
  },
}

// ---------- Pricing ----------
const PLAN_TEXTS = [
  ['Free', 'Basic access', '$0', ['Limited readings', 'Basic insights', 'Daily tarot card']],
  ['Pro', 'Most popular', '$9.99', ['Unlimited readings', 'Full astrology', 'Dream analysis', 'AI Companion']],
  ['Premium', 'For deep explorers', '$19.99', ['Everything in Pro', 'Priority access', 'Advanced reports', 'Early features']],
]
const CTA = { 'Get Started': 0, Upgrade: 1, Choose: 2 }

const MANAGE = [602, 850, 330, 52, 26] // під картками тарифів, по центру
// кнопки тарифів на плиті (як у hits макета): поточний тариф закриваємо плашкою «Ваш тариф» точно по кнопці
const CTA_RECTS = [
  [504, 735, 234, 54, 27],
  [803, 734, 238, 56, 28],
  [1107, 735, 225, 54, 27],
]

async function openPortal() {
  const { url } = await post('/billing/portal')
  if (!url) throw new Error(t('The payment page could not be opened. Try again in a moment.'))
  window.location.assign(url)
}

const CONFIRM_TRIES = 12
const CONFIRM_EVERY_MS = 2500
/** Після повернення зі Stripe чекає, поки вебхук ввімкне платний тариф, і чесно каже, що відбулося. */
async function confirmPayment() {
  say(t('Back from the payment page. Waiting for the confirmation…'))
  for (let i = 0; i < CONFIRM_TRIES; i++) {
    await new Promise((r) => setTimeout(r, CONFIRM_EVERY_MS))
    const plan = await get('/profile').then((p) => p.plan, () => 'free')
    if (plan !== 'free') return say(t('Payment confirmed: your plan is {name}.', { name: plan }))
  }
  say(t('The payment is not confirmed yet. If you paid, check again in a minute; if not, nothing was charged.'))
}

export const pricing = {
  bind: PLAN_TEXTS.flatMap(([name, tagline, price, features], i) => [
    { find: name, key: `p${i}.name` },
    { find: tagline, key: `p${i}.tagline`, maxw: i === 2 ? 155 : 235 }, // у Premium поруч корона
    { find: price, key: `p${i}.price` },
    { find: '/mo', nth: i, after: `p${i}.price` }, // «/міс» одразу за ціною, а не там, де стояла довга ціна макета
    // усі переваги всіх трьох карток — одна група: однаковий кегль скрізь, а стискає його найдовший рядок; у межах картки тарифу
    ...features.map((f, j) => ({ find: f, key: `p${i}.f${j}`, maxw: 180, group: 'plan-features' })),
  ]),
  async load() {
    const plans = await get('/plans')
    // повернення зі сторінки оплати: адреса з ?checkout=success нічого не доводить, а тариф вмикає вебхук і з затримкою,
    // тож не кажемо «оплачено», а чекаємо, поки сервер справді покаже платний тариф
    if (hashParam('checkout') === 'success') confirmPayment()
    if (hashParam('checkout') === 'cancelled') say(t('Payment was cancelled. Nothing was charged.'))
    if (hashParam('checkout')) window.history.replaceState(window.history.state, '', '#/pricing') // щоб оновлення сторінки не повторювало
    const billing = getToken() ? await get('/billing').catch(() => null) : null
    const subscribed = !!billing?.options?.canManage // підписка, якою керують лише в порталі Stripe
    const values = {}
    plans.forEach((p, i) => {
      values[`p${i}.name`] = p.name
      values[`p${i}.tagline`] = p.tagline
      values[`p${i}.price`] = `$${p.price}`
      p.features.forEach((f, j) => (values[`p${i}.f${j}`] = f))
    })
    return { values, data: { plans, subscribed, current: billing?.plan ?? null } }
  },
  Over({ ctx }) {
    const index = ctx.data?.plans?.findIndex((p) => p.id === ctx.data.current) ?? -1
    return (
      <>
        {index >= 0 && <Ov at={CTA_RECTS[index]} className="yourplan ov-none">{t('Your plan')}</Ov>}
        {/* підписку змінюють чи скасовують у порталі Stripe: звичайний запит тарифу її не змінює */}
        {ctx.data?.subscribed && (
          <Ov at={MANAGE} className="manage">
            <button type="button" onClick={() => ctx.run(openPortal)}>{t('Manage subscription')}</button>
          </Ov>
        )}
      </>
    )
  },
  actions: Object.fromEntries(
      Object.entries(CTA).map(([label, i]) => [
        label,
        async (ctx) => {
          if (!getToken()) return ctx.go('/register')
          const plan = ctx.data?.plans[i]
          if (!plan) throw new Error(t('Data is still loading'))
          if (plan.id === ctx.data.current) return ctx.say(t('This is your current plan.'))
          // з активною підпискою змінити чи скасувати тариф можна лише в порталі Stripe (checkout відповів би 409)
          if (ctx.data.subscribed) return openPortal()
          if (plan.price > 0) {
            // платний тариф: сервер створює сесію оплати Stripe й повертає адресу; тариф вмикається вебхуком після оплати.
            // Без підключеної оплати в демо-режимі сервер вмикає тариф одразу й адреси не дає.
            const res = await post('/billing/checkout', { plan: plan.id })
            if (res?.url) return window.location.assign(res.url)
            // без url іти на головну можна лише коли сервер прямо підтвердив демо-активацію (без оплати); будь-яка інша відповідь — помилка
            if (res?.activated === true && res?.plan === plan.id) {
              ctx.say(t('Demo mode: {name} was switched on without payment, because Stripe is not set up on the server.', { name: plan.name }))
              return ctx.go('/dashboard')
            }
            throw new Error(t('The payment page could not be opened. Try again in a moment.'))
          } else {
            await post('/billing/plan', { plan: plan.id })
          }
          ctx.say(t('Plan: {name}', { name: plan.name }))
          ctx.go('/dashboard')
        },
      ]),
    ),
}

// ---------- Register ----------
export const registerScreen = {
  bind: [],
  actions: {
    'Create Account': async (ctx) => {
      const value = (id) => ctx.field(id)?.value ?? ''
      const [name, email, password] = [value('fullname').trim(), value('email').trim(), value('password')]
      if (!name || !email || !password) throw new Error(t('Fill in your name, email and password'))
      if (password !== value('confirm')) throw new Error(t('Passwords do not match'))
      if (!ctx.ui.on.terms) throw new Error(t('You need to agree to the terms'))
      await register(name, email, password)
      await saveCurrentLanguage() // мова, обрана на сторінці реєстрації, стає мовою акаунта
      ctx.go('/dashboard')
    },
  },
}

// ---------- Tarot Studio ----------
const SPREAD_NAMES = ['Daily Card', 'Three Cards', 'Relationship', 'Career', 'Life Purpose', 'Yes / No']

// Карти не обирає сервер: розклад, колода й режим запам'ятовуються, а людина сама тягне карти на екрані /draw
function startReading(ctx, spreadId) {
  if (!spreadId) throw new Error(t('Data is still loading'))
  const mode = ctx.ui.radio.mode ?? 'quick'
  // режими поза тарифом не пропускаємо на екран /draw: сервер однаково відмовив би, а тут можна сказати чому й що робити
  const allowed = ctx.data?.limits?.readingModes
  if (allowed && !allowed.includes(mode)) throw new Error(mode === 'depth' ? t('Depth readings are included in Premium.') : t('Detailed readings are included in Pro and Premium.'))
  session.set('draw', JSON.stringify({ spreadId, deck: ctx.ui.sel.deck, mode }))
  ctx.go('/draw')
}

export const tarot = {
  bind: SPREAD_NAMES.map((find, i) => ({ find, key: `spread${i}` })),
  async load() {
    // ліміти тарифу потрібні лише для підказки про режим; якщо запит не вдався, пускаємо далі й рішення лишається за сервером
    const [all, decks, billing] = await Promise.all([get('/tarot/spreads'), get('/tarot/decks'), getToken() ? get('/billing').catch(() => null) : null])
    // у плиті шість рядків: «Власний розклад» (Custom) стоїть лише в старих записах історії, на його місці — «Так/Ні»
    const spreads = all.filter((x) => x.id !== 'custom')
    return {
      values: Object.fromEntries(spreads.map((s, i) => [`spread${i}`, s.name])),
      data: { spreads, limits: billing?.limits ?? null },
      ui: { options: { deck: decks.decks } },
    }
  },
  actions: {
    'Start Reading': (ctx) => startReading(ctx, 'three'),
    ...Object.fromEntries(SPREAD_NAMES.map((label, i) => [label, (ctx) => startReading(ctx, ctx.data?.spreads[i]?.id)])),
  },
}
