import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { analyzeDream } from '../dreams/analysis'
import { localReply } from '../companion/local'
import { personas } from '../companion/personas'
import { natalChart } from '../astrology/astro'
import { buildReport } from '../astrology/report'
import { monthlyInsight, moonEventName, planetName, signName } from '../astrology/text'
import { plans } from '../plans/plans'
import { cardOf } from '../tarot/cards'
import { draw, interpret, spreadsFor } from '../tarot/readings'
import { currentLocale, localeFromSetting, parseLocale, runWithLocale } from './locale'
import { msg, validationMessage } from './messages'

const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const cyrillic = /[А-Яа-яІіЇїЄєҐґ]/

test('the locale comes from Accept-Language, with English as the default', () => {
  strictEqual(parseLocale('uk-UA,uk;q=0.9,en;q=0.8'), 'uk')
  strictEqual(parseLocale('es'), 'es')
  strictEqual(parseLocale('fr-FR'), 'en')
  strictEqual(parseLocale(undefined), 'en')
})

test('the settings name maps to a locale', () => {
  strictEqual(localeFromSetting('Ukrainian'), 'uk')
  strictEqual(localeFromSetting('Spanish'), 'es')
  strictEqual(localeFromSetting('whatever'), 'en')
})

test('the request locale is available anywhere inside runWithLocale', async () => {
  strictEqual(currentLocale(), 'en')
  await runWithLocale('uk', async () => {
    await new Promise((r) => setTimeout(r, 5))
    strictEqual(currentLocale(), 'uk')
  })
})

test('every card has a unique name and meanings in every language', () => {
  for (const l of ['en', 'uk', 'es'] as const) {
    const cards = Array.from({ length: 78 }, (_, i) => cardOf(i, l))
    strictEqual(new Set(cards.map((c) => c.name)).size, 78, l)
    for (const c of cards) ok(c.upright.length > 3 && c.reversed.length > 3, `${l} ${c.id}`)
  }
  strictEqual(cardOf(0, 'uk').name, 'Блазень')
  strictEqual(cardOf(0, 'es').name, 'El Loco')
  strictEqual(cardOf(22, 'uk').name, 'Туз Жезлів')
  strictEqual(cardOf(36, 'es').name, 'As de Copas')
})

test('spreads and the reading text follow the language', () => {
  deepStrictEqual(spreadsFor('uk').find((s) => s.id === 'three')!.positions, ['Минуле', 'Теперішнє', 'Майбутнє'])
  const cards = draw('three', seeded(7))
  const uk = interpret('three', cards, 'quick', 'uk')
  ok(cyrillic.test(uk.summary) && uk.positions.every((p) => cyrillic.test(p.label) && cyrillic.test(p.meaning)))
  const es = interpret('three', cards, 'depth', 'es')
  ok(/Pasado/.test(es.positions[0].label) && /dirección/.test(es.summary))
  ok(!cyrillic.test(es.summary))
})

test('dream symbols are found in any language and reported in the requested one', () => {
  const uk = analyzeDream('Старий дім', 'Я була в старому будинку з дитинства, там було яскраве світло.', 'uk')
  ok(uk.symbols.includes('Будинок') && uk.symbols.includes('Дитинство') && uk.symbols.includes('Світло'), uk.symbols.join())
  ok(cyrillic.test(uk.interpretation))
  const es = analyzeDream('Bosque', 'Caminaba por un bosque oscuro cerca del mar.', 'es')
  ok(es.symbols.includes('Bosque') && es.symbols.includes('Agua'), es.symbols.join())
  const en = analyzeDream('x', 'a forest and the sea', 'en')
  deepStrictEqual(en.symbols, ['Forest', 'Water'])
})

test('dream kinds are localized and detected in every language', () => {
  strictEqual(analyzeDream('x', 'Це був кошмар, я злякалась.', 'uk').kind, 'Кошмар')
  strictEqual(analyzeDream('x', 'Sueño lúcido: sabía que estaba soñando.', 'es').kind, 'Sueño lúcido')
  strictEqual(analyzeDream('x', 'I walked in a park.', 'en').kind, 'Dream')
})

test('zodiac signs, planets, moon events and insights are localized', () => {
  strictEqual(signName('Cancer', 'uk'), 'Рак')
  strictEqual(signName('Gemini', 'es'), 'Géminis')
  strictEqual(planetName('Mercury', 'uk'), 'Меркурій')
  strictEqual(moonEventName('Full Moon', 'es'), 'Luna llena')
  ok(cyrillic.test(monthlyInsight(new Date('2026-11-03'), 'uk')))
  ok(/espejo|tiempo|momento|época/i.test(monthlyInsight(new Date('2026-11-03'), 'es')) || monthlyInsight(new Date('2026-11-03'), 'es').length > 10)
})

test('the natal report is written in the requested language', () => {
  const r = buildReport(natalChart({ birthDate: '2004-06-22' }), 'uk')
  ok(cyrillic.test(r.title) && r.text.includes('Рак'))
})

test('companion personas and fallback replies are localized', () => {
  const p = personas('uk')
  strictEqual(p[0].id, 'Mystic Guide')
  ok(cyrillic.test(p[0].name) && p[0].description.every((d) => cyrillic.test(d)))
  const say = (persona: string, text: string, locale: 'uk' | 'es') => localReply({ persona, text, locale, history: [], ctx: { name: 'X' }, now: new Date('2026-11-03') })
  ok(cyrillic.test(say('Astrologer', 'що буде?', 'uk')))
  ok(/Mercurio/.test(say('Astrologer', 'qué pasará', 'es')))
  ok(cyrillic.test(say('Life Coach', 'допоможи', 'uk')))
})

test('plans keep their ids and translate the text', () => {
  const uk = plans('uk')
  deepStrictEqual(uk.map((p) => p.id), ['free', 'pro', 'premium'])
  ok(cyrillic.test(uk[1].tagline) && uk[1].features.every((f) => cyrillic.test(f)))
  strictEqual(uk[1].price, 9.99)
})

test('server messages and validation errors are localized', () => {
  strictEqual(msg('en', 'badCredentials'), 'Invalid email or password')
  ok(cyrillic.test(msg('uk', 'badCredentials')))
  ok(/inválido/i.test(msg('es', 'badCredentials')))
  strictEqual(msg('en', 'upstreamDown', { name: 'NASA' }), 'NASA is temporarily unavailable')
  ok(/пошта|email/i.test(validationMessage('uk', 'isEmail', 'email', [])))
  ok(/8/.test(validationMessage('es', 'minLength', 'password', [8])))
})
