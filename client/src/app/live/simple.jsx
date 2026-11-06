// Екрани без складних оверлеїв: Dashboard, Pricing, Register, Tarot Studio.
import { get, getToken, post } from '../../lib/api.js'
import { register } from '../../lib/auth.js'
import { greeting } from '../format.js'
import { t } from '../../i18n/index.js'
import { saveCurrentLanguage } from '../../i18n/sync.js'
import { session } from './common.js'
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

export const pricing = {
  bind: PLAN_TEXTS.flatMap(([name, tagline, price, features], i) => [
    { find: name, key: `p${i}.name` },
    { find: tagline, key: `p${i}.tagline`, maxw: i === 1 ? 160 : 235 }, // у Pro поруч корона
    { find: price, key: `p${i}.price` },
    ...features.map((f, j) => ({ find: f, key: `p${i}.f${j}`, maxw: 180 })), // у межах картки тарифу
  ]),
  async load() {
    const plans = await get('/plans')
    const values = {}
    plans.forEach((p, i) => {
      values[`p${i}.name`] = p.name
      values[`p${i}.tagline`] = p.tagline
      values[`p${i}.price`] = `$${p.price}`
      p.features.forEach((f, j) => (values[`p${i}.f${j}`] = f))
    })
    return { values, data: { plans } }
  },
  actions: Object.fromEntries(
      Object.entries(CTA).map(([label, i]) => [
        label,
        async (ctx) => {
          if (!getToken()) return ctx.go('/register')
          const plan = ctx.data?.plans[i]
          if (!plan) throw new Error(t('Data is still loading'))
          await post('/billing/plan', { plan: plan.id })
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
  session.set('draw', JSON.stringify({ spreadId, deck: ctx.ui.sel.deck, mode: ctx.ui.radio.mode ?? 'quick' }))
  ctx.go('/draw')
}

export const tarot = {
  bind: SPREAD_NAMES.map((find, i) => ({ find, key: `spread${i}` })),
  async load() {
    const [all, decks] = await Promise.all([get('/tarot/spreads'), get('/tarot/decks')])
    // у плиті шість рядків: «Власний розклад» (Custom) стоїть лише в старих записах історії, на його місці — «Так/Ні»
    const spreads = all.filter((x) => x.id !== 'custom')
    return {
      values: Object.fromEntries(spreads.map((s, i) => [`spread${i}`, s.name])),
      data: { spreads },
      ui: { options: { deck: decks.decks } },
    }
  },
  actions: {
    'Start Reading': (ctx) => startReading(ctx, 'three'),
    ...Object.fromEntries(SPREAD_NAMES.map((label, i) => [label, (ctx) => startReading(ctx, ctx.data?.spreads[i]?.id)])),
  },
}
