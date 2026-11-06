import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { natalChart } from './astro'
import { buildCompatibility, crossAspects, levelOf, scoresOf, signFactors, sphereText } from './synastry'

const cyrillic = /[А-Яа-яІіЇїЄєҐґ]/

test('cross aspects pair each planet of one chart with each planet of the other', () => {
  const found = crossAspects([{ name: 'Sun', longitude: 10 }], [{ name: 'Moon', longitude: 130 }, { name: 'Venus', longitude: 101 }, { name: 'Mars', longitude: 200 }])
  // Місяць — тригон (орбіс 0), Венера — квадратура (1°), Марс на 190° від Сонця — опозиція з орбісом 10, тобто поза допуском
  deepStrictEqual(found.map((x) => [x.a, x.b, x.type]).sort(), [['Sun', 'Moon', 'trine'], ['Sun', 'Venus', 'square']])
})

test('two slow planets are not counted between the charts: they belong to a whole generation', () => {
  deepStrictEqual(crossAspects([{ name: 'Pluto', longitude: 10 }], [{ name: 'Neptune', longitude: 10 }]), [])
})

test('the important pairs come first, however loose', () => {
  const found = crossAspects([{ name: 'Sun', longitude: 0 }, { name: 'Uranus', longitude: 0 }], [{ name: 'Moon', longitude: 6 }, { name: 'Venus', longitude: 0 }])
  strictEqual(found[0].b === 'Moon' || found[0].b === 'Venus', true)
  strictEqual(found[0].a, 'Sun')
})

test('the percentage follows all aspects: easy ones raise it, tense ones lower it, always within 1–100', () => {
  const easy = { a: 'Moon', b: 'Venus', type: 'trine', orb: 0, orbMax: 6 }
  const hard = { a: 'Moon', b: 'Saturn', type: 'square', orb: 0, orbMax: 6 }
  ok(scoresOf([easy]).overall > scoresOf([]).overall)
  const sphere = (aspects: Parameters<typeof scoresOf>[0], id: string) => scoresOf(aspects).categories.find((c) => c.id === id)?.score as number
  ok(sphere([{ a: 'Venus', b: 'Jupiter', type: 'trine', orb: 0, orbMax: 6 }], 'money') > sphere([{ a: 'Venus', b: 'Saturn', type: 'square', orb: 0, orbMax: 6 }], 'money'), 'money follows Venus–Jupiter and Venus–Saturn')
  ok(sphere([{ a: 'Venus', b: 'Moon', type: 'trine', orb: 0, orbMax: 6 }], 'love') > sphere([], 'love'), 'love follows Venus')
  strictEqual(sphere([{ a: 'Mercury', b: 'Mars', type: 'square', orb: 0, orbMax: 6 }], 'money'), sphere([], 'money'), 'unrelated planets do not move a sphere')
  ok(scoresOf([hard]).overall < scoresOf([]).overall)
  ok(scoresOf([easy, easy, hard]).overall > scoresOf([easy, hard, hard]).overall)
  ok(scoresOf(Array.from({ length: 40 }, () => easy)).overall <= 100)
  ok(scoresOf(Array.from({ length: 40 }, () => easy)).overall >= 90, 'many tight easy aspects reach the top of the scale')
  ok(scoresOf(Array.from({ length: 40 }, () => hard)).overall >= 1)
  ok(scoresOf(Array.from({ length: 40 }, () => hard)).overall <= 10, 'many tight tense aspects reach the bottom of the scale')
})

test('every aspect counts: adding any aspect changes the overall percentage', () => {
  const base = [{ a: 'Sun', b: 'Moon', type: 'trine', orb: 1, orbMax: 6 }]
  for (const extra of [{ a: 'Jupiter', b: 'Saturn', type: 'square', orb: 1, orbMax: 6 }, { a: 'Mercury', b: 'Mars', type: 'sextile', orb: 1, orbMax: 4 }, { a: 'Venus', b: 'Pluto', type: 'opposition', orb: 2, orbMax: 8 }]) {
    ok(scoresOf([...base, extra]).overall !== scoresOf(base).overall, extra.type)
  }
})

test('a tighter aspect weighs more than a loose one', () => {
  const tight = { a: 'Sun', b: 'Moon', type: 'square', orb: 0.2, orbMax: 6 }
  const loose = { a: 'Sun', b: 'Moon', type: 'square', orb: 5.5, orbMax: 6 }
  ok(scoresOf([tight]).overall < scoresOf([loose]).overall)
})

test('tension in Venus–Mars is partly chemistry: it costs less than the same square elsewhere', () => {
  const chem = { a: 'Venus', b: 'Mars', type: 'square', orb: 0, orbMax: 6 }
  const plain = { a: 'Moon', b: 'Saturn', type: 'square', orb: 0, orbMax: 6 }
  ok(scoresOf([chem]).overall > scoresOf([plain]).overall)
})

test('the counted aspects split into harmonious and tense and add up', () => {
  const { counted } = scoresOf([
    { a: 'Sun', b: 'Moon', type: 'trine', orb: 1, orbMax: 6 },
    { a: 'Sun', b: 'Mars', type: 'square', orb: 1, orbMax: 6 },
    { a: 'Moon', b: 'Venus', type: 'sextile', orb: 1, orbMax: 4 },
  ])
  deepStrictEqual(counted, { total: 3, harmonious: 2, tense: 1 })
})

test('the level label follows the score', () => {
  deepStrictEqual([levelOf(90)[0], levelOf(65)[0], levelOf(50)[0], levelOf(20)[0]], ['very harmonious', 'harmonious', 'balanced, with lessons to learn', 'challenging, but rich in growth'])
})

test('the compatibility report has every section, both languages, and names both people', () => {
  const a = natalChart({ birthDate: '2004-06-22' })
  const b = natalChart({ birthDate: '1999-03-14' })
  for (const [locale, heads] of [['en', ['## Overview', '## Compatibility by life sphere', '## Key connections', '## Strengths', '## Growth areas', '## Elements', '## Note']], ['uk', ['## Огляд', '## Сумісність за сферами життя', '## Ключові зв’язки', '## Сильні сторони', '## Зони зростання', '## Стихії', '## Примітка']]] as const) {
    const r = buildCompatibility(a, b, { a: 'Yullia', b: 'Anna' }, locale)
    for (const h of heads) ok(r.text.includes(h), `${locale} ${h}`)
    ok(r.title.includes('Yullia') && r.title.includes('Anna'))
    ok(r.score >= 1 && r.score <= 100)
    strictEqual(r.counted.total, r.allAspects.length)
    ok(r.text.includes(r.score + '%'), 'the percentage is in the text')
    strictEqual(r.categories.length, 11)
    ok(r.categories.every((c) => c.text.length > 20 && r.text.includes(c.name) && c.score >= 1 && c.score <= 100), 'every sphere has a score and a text')
    for (const id of ['love', 'attraction', 'money', 'family', 'career']) ok(r.categories.some((c) => c.id === id), id)
    ok(r.aspects.length > 0 && r.aspects.every((x) => x.meaning.length > 20))
    strictEqual(cyrillic.test(r.text), locale === 'uk')
    ok(!/undefined|NaN/.test(r.text), 'no holes in the text')
  }
})

test('the same person twice is highly compatible: the Sun, the Moon and every planet meet at 0°', () => {
  const a = natalChart({ birthDate: '2004-06-22' })
  const r = buildCompatibility(a, a, { a: 'A', b: 'B' }, 'en')
  ok(r.score >= 60, `score ${r.score}`)
})

test('the sign harmony of key planets counts: the same signs beat unfriendly ones', () => {
  const planets = (sign: string) => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].map((name) => ({ name, sign }))
  const same = signFactors(planets('Aries'), planets('Aries'))
  const clash = signFactors(planets('Aries'), planets('Cancer'))
  ok(scoresOf([], same).overall > scoresOf([], clash).overall)
})

test('real pairs use the whole 1–100 scale: ordinary pairs sit around 50, rare ones go far to both ends', () => {
  let seed = 7 // детермінований генератор: тест не «пливе»
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const chart = () => natalChart({ birthDate: `${1940 + Math.floor(random() * 70)}-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}` })
  const scores: number[] = []
  for (let i = 0; i < 500; i++) {
    const [a, b] = [chart(), chart()]
    scores.push(scoresOf(crossAspects(a.planets, b.planets), signFactors(a.planets, b.planets)).overall)
  }
  scores.sort((x, y) => x - y)
  const at = (p: number) => scores[Math.floor(p * (scores.length - 1))]
  ok(at(0.5) >= 42 && at(0.5) <= 58, `median ${at(0.5)}`)
  ok(at(0.05) <= 20, `5th percentile ${at(0.05)}`)
  ok(at(0.95) >= 80, `95th percentile ${at(0.95)}`)
  ok(scores[0] >= 1 && scores[scores.length - 1] <= 100)
})

test('a sphere text follows its score: high, middle and low differ', () => {
  const texts = [90, 50, 10].map((score) => sphereText('money', score, 'en'))
  strictEqual(new Set(texts).size, 3)
  strictEqual(sphereText('love', 50, 'en') === sphereText('love', 50, 'uk'), false)
})
