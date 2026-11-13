// Екрани без складних оверлеїв: Dashboard, Pricing, Register, Tarot Studio.
import { get, getToken } from '../../lib/api.js'
import { register } from '../../lib/auth.js'
import { greeting } from '../format.js'
import { t } from '../../i18n/index.js'
import { saveCurrentLanguage } from '../../i18n/sync.js'
import { Ov } from './parts.jsx'
import { choosePlan, loadPricing, openPortal } from '../pages/pricing.js'
import { startReading } from '../pages/tarotStart.js'

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
    { find: '24', key: 'reports' },
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
        reports: d.counts.reports,
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
    const data = await loadPricing()
    const values = {}
    data.plans.forEach((p, i) => {
      values[`p${i}.name`] = p.name
      values[`p${i}.tagline`] = p.tagline
      values[`p${i}.price`] = `$${p.price}`
      p.features.forEach((f, j) => (values[`p${i}.f${j}`] = f))
    })
    return { values, data }
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
  actions: Object.fromEntries(Object.entries(CTA).map(([label, i]) => [label, (ctx) => choosePlan(ctx.data?.plans[i], ctx.data, ctx)])),
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

// Карти не обирає сервер: розклад і режим запам'ятовуються, а людина сама тягне карти на екрані /draw (колода одна, тож не обирається)
function startFromScreen(ctx, spreadId) {
  if (!spreadId) throw new Error(t('Data is still loading'))
  startReading(spreadId, ctx.ui.radio.mode ?? 'quick', ctx.data?.limits)
}

export const tarot = {
  bind: SPREAD_NAMES.map((find, i) => ({ find, key: `spread${i}` })),
  async load() {
    // ліміти тарифу потрібні лише для підказки про режим; якщо запит не вдався, пускаємо далі й рішення лишається за сервером
    const [all, billing] = await Promise.all([get('/tarot/spreads'), getToken() ? get('/billing').catch(() => null) : null])
    // у плиті шість рядків: «Власний розклад» (Custom) стоїть лише в старих записах історії, на його місці — «Так/Ні»
    const spreads = all.filter((x) => x.id !== 'custom')
    return {
      values: Object.fromEntries(spreads.map((s, i) => [`spread${i}`, s.name])),
      data: { spreads, limits: billing?.limits ?? null },
    }
  },
  actions: {
    'Start Reading': (ctx) => startFromScreen(ctx, 'three'),
    ...Object.fromEntries(SPREAD_NAMES.map((label, i) => [label, (ctx) => startFromScreen(ctx, ctx.data?.spreads[i]?.id)])),
    // «Карта дня» не розклад із вибором колоди: одна карта на день зі своєю серією, тож веде на окрему сторінку
    'Daily Card': (ctx) => ctx.go('/daily'),
  },
}
