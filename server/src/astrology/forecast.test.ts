import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { natalChart } from './astro'
import { MONTH_DAYS, WEEK_DAYS, TransitHit, addDays, buildForecast, influenceOf, planetsAt, scoreDay, sphereText, transitHits } from './forecast'

const cyrillic = /[А-Яа-яІіЇїЄєҐґ]/
const natal = natalChart({ birthDate: '2004-06-22' }).planets
const hit = (a: string, b: string, type: string, orb = 0, valence = 0.9): TransitHit => ({ a, b, type, orb, orbMax: 3, valence })

test('transit hits pair a transiting planet with a natal one within the transit orb', () => {
  const hits = transitHits([{ name: 'Sun', longitude: 130 }], [{ name: 'Moon', longitude: 10 }])
  deepStrictEqual(hits.map((h) => [h.a, h.b, h.type, Math.round(h.orb)]), [['Sun', 'Moon', 'trine', 0]])
  deepStrictEqual(transitHits([{ name: 'Sun', longitude: 140 }], [{ name: 'Moon', longitude: 10 }]), []) // 10° від тригона: поза допуском
})

test('slow planets touch only the personal planets of the natal chart', () => {
  const natalPlanets = [{ name: 'Jupiter', longitude: 10 }, { name: 'Saturn', longitude: 10 }, { name: 'Sun', longitude: 10 }]
  const hits = transitHits([{ name: 'Pluto', longitude: 10 }], natalPlanets)
  deepStrictEqual(hits.map((h) => h.b), ['Sun'])
})

test('the Moon can be left out of a search for key events', () => {
  deepStrictEqual(transitHits([{ name: 'Moon', longitude: 10 }], [{ name: 'Sun', longitude: 10 }], false), [])
})

test('easy aspects raise the day score and tense ones lower it, always within 1–99', () => {
  const none = scoreDay([]).overall
  ok(scoreDay([hit('Jupiter', 'Sun', 'trine')]).overall > none)
  ok(scoreDay([hit('Saturn', 'Sun', 'square', 0, -1)]).overall < none)
  const many = Array.from({ length: 30 }, () => hit('Jupiter', 'Venus', 'trine'))
  ok(scoreDay(many).overall <= 99)
  ok(scoreDay(many.map((h) => ({ ...h, valence: -1 }))).overall >= 1)
})

test('a sphere is moved only by aspects to its own natal planets', () => {
  const venus = [hit('Jupiter', 'Venus', 'trine')]
  ok(scoreDay(venus).spheres.love > scoreDay([]).spheres.love)
  strictEqual(scoreDay(venus).spheres.energy, scoreDay([]).spheres.energy) // Венера — не планета енергії
  ok(influenceOf(venus, 'love') > 0 && influenceOf(venus, 'energy') === 0)
})

test('a tighter aspect weighs more than a loose one', () => {
  ok(scoreDay([hit('Mars', 'Sun', 'square', 0.1, -1)]).overall < scoreDay([hit('Mars', 'Sun', 'square', 2.9, -1)]).overall)
})

test('the forecast covers today, a week and a month ahead with every part filled in', () => {
  const f = buildForecast(natal, '2026-11-06', 'en')
  strictEqual(f.date, '2026-11-06')
  strictEqual(f.day.date, '2026-11-06')
  strictEqual(f.week.days.length, WEEK_DAYS)
  strictEqual(f.month.days.length, MONTH_DAYS)
  strictEqual(f.week.to, addDays('2026-11-06', WEEK_DAYS - 1))
  strictEqual(f.month.to, addDays('2026-11-06', MONTH_DAYS - 1))
  strictEqual(f.day.spheres.length, 5)
  ok(f.day.spheres.every((s) => s.score >= 1 && s.score <= 99 && s.text.length > 20))
  ok(f.day.headline.length > 20 && f.week.headline.length > 20 && f.month.headline.length > 20)
  ok(f.day.moon.signName.length > 0 && f.day.moon.phase.length > 0)
  ok(f.week.events.length <= 6 && f.month.events.length <= 10 && f.month.events.length > 0)
  ok(f.week.events.every((e) => e.from <= e.exact && e.exact <= e.to && e.from >= '2026-11-06' && e.to <= f.week.to))
  ok(f.month.events.every((e) => e.transit.id !== 'Moon'), 'the Moon aspects daily and is shown as phases instead')
  ok(f.month.bestDays.length <= 3 && f.month.hardDays.length <= 3)
  ok(f.month.bestDays.every((d) => (f.month.days.find((x) => x.date === d)?.overall ?? 0) >= 55), 'best days are above neutral')
  ok(f.month.hardDays.every((d) => (f.month.days.find((x) => x.date === d)?.overall ?? 100) <= 45), 'demanding days are below neutral')
  ok(f.week.spheres.length === 5 && f.month.spheres.every((s) => s.score >= 1 && s.score <= 99))
  ok(f.month.moonEvents.length >= 1 && f.month.moonEvents.length <= 3, 'a 30-day month has one or two of each phase')
  ok(f.month.moonEvents.every((m) => m.date >= '2026-11-06' && m.date <= f.month.to))
})

test('the best and the most demanding days are the extremes of the period', () => {
  const f = buildForecast(natal, '2026-11-06', 'en')
  const score = (date: string) => f.month.days.find((d) => d.date === date)?.overall as number
  const sorted = [...f.month.days].sort((x, y) => y.overall - x.overall)
  if (f.month.bestDays.length) strictEqual(score(f.month.bestDays[0]) >= sorted[3].overall, true)
  if (f.month.hardDays.length) strictEqual(score(f.month.hardDays[0]) <= sorted[sorted.length - 4].overall, true)
})

test('the forecast is the same for the same person and day, and differs between people and days', () => {
  const a = buildForecast(natal, '2026-11-06', 'en')
  deepStrictEqual(buildForecast(natal, '2026-11-06', 'en'), a)
  const other = natalChart({ birthDate: '1985-02-11' }).planets
  ok(JSON.stringify(buildForecast(other, '2026-11-06', 'en').day) !== JSON.stringify(a.day))
  ok(JSON.stringify(buildForecast(natal, '2026-11-20', 'en').day) !== JSON.stringify(a.day))
})

test('both languages are complete: no holes, and Ukrainian text is Ukrainian', () => {
  for (const locale of ['en', 'uk'] as const) {
    const f = buildForecast(natal, '2026-11-06', locale)
    const text = JSON.stringify(f)
    ok(!/undefined|NaN|null/.test(text.replace(/"aspect":null/g, '')), `${locale}: no holes`)
    strictEqual(cyrillic.test(f.day.headline), locale === 'uk')
    strictEqual(cyrillic.test(f.month.events[0].meaning), locale === 'uk')
    strictEqual(cyrillic.test(f.day.spheres[0].text), locale === 'uk')
  }
})

test('a sphere text follows its score: high, middle and low differ', () => {
  const texts = [90, 50, 10].map((score) => sphereText('love', score, 'en'))
  strictEqual(new Set(texts).size, 3)
})

test('real days use the whole scale: the median sits near 50 and the tails go far', () => {
  let seed = 11 // детермінований генератор: тест не «пливе»
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const scores: number[] = []
  for (let p = 0; p < 12; p++) {
    const chart = natalChart({ birthDate: `${1950 + Math.floor(random() * 55)}-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}` }).planets
    for (let d = 0; d < 80; d++) scores.push(scoreDay(transitHits(planetsAt(new Date(`${addDays('2026-01-01', Math.floor(random() * 700))}T12:00:00Z`)), chart)).overall)
  }
  scores.sort((x, y) => x - y)
  const at = (q: number) => scores[Math.floor(q * (scores.length - 1))]
  ok(at(0.5) >= 44 && at(0.5) <= 56, `median ${at(0.5)}`)
  ok(at(0.05) <= 22, `p5 ${at(0.05)}`)
  ok(at(0.95) >= 78, `p95 ${at(0.95)}`)
})
