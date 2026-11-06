import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { natalChart } from './astro'
import { aspectsOf, buildReport, dominant, moonPhaseIndex, sunMoonRelation } from './report'
import { aspectText, placementText } from './readings'
import { PAIRS } from './pairs'

const cyrillic = /[А-Яа-яІіЇїЄєҐґ]/

test('angles between planets become aspects within their orb, tightest first', () => {
  const found = aspectsOf([
    { name: 'Sun', longitude: 10 },
    { name: 'Moon', longitude: 130 }, // 120° від Сонця: тригон, орбіс 0
    { name: 'Mars', longitude: 101 }, // 91° від Сонця: квадратура, орбіс 1
    { name: 'Venus', longitude: 200 }, // 170° від Сонця: опозиція з орбісом 10, тобто поза допуском 8
  ])
  deepStrictEqual(found.map((x) => [x.a, x.b, x.type, Math.round(x.orb)]), [
    ['Sun', 'Moon', 'trine', 0],
    ['Sun', 'Mars', 'square', 1],
  ])
})

test('the moon phase at birth is one of eight 45° sectors from the Sun', () => {
  strictEqual(moonPhaseIndex(100, 100), 0) // новий місяць
  strictEqual(moonPhaseIndex(100, 190), 2) // перша чверть
  strictEqual(moonPhaseIndex(100, 280), 4) // повний місяць (180° від Сонця)
  strictEqual(moonPhaseIndex(350, 10), 0) // перехід через 0°
})

test('the dominant element and modality are the most common among the planets', () => {
  strictEqual(dominant(['fire', 'fire', 'earth', 'water']), 'fire')
  strictEqual(dominant(['air']), 'air')
})

test('the full report has every section and real content', () => {
  const r = buildReport(natalChart({ birthDate: '2004-06-22' }), 'en')
  for (const h of ['## Overview', '## Planets', '## Elements and modalities', '## Key aspects', '## Moon phase at birth', '## Note']) ok(r.text.includes(h), h)
  const planetsPart = r.text.split('## Planets')[1].split('## Elements')[0]
  strictEqual(planetsPart.split('\n').filter((l) => /^(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto) in /.test(l)).length, 10)
  ok(r.text.length > 2000, `length ${r.text.length}`)
  ok(/Cancer/.test(r.title))
})

test('the report is written entirely in the requested language', () => {
  const uk = buildReport(natalChart({ birthDate: '2004-06-22' }), 'uk')
  ok(uk.text.includes('## Планети') && uk.text.includes('## Ключові аспекти') && cyrillic.test(uk.text))
  ok(!/Planets|Elements|Overview/.test(uk.text))
})

test('the ascendant is described only when it is known', () => {
  const without = buildReport(natalChart({ birthDate: '2004-06-22' }), 'en').text
  const withAsc = buildReport(natalChart({ birthDate: '2004-06-22', birthTime: '08:30', lat: 50.45, lon: 30.52, timeZone: 'Europe/Kyiv' }), 'en').text
  ok(!/Ascendant in/.test(without.split('## Planets')[0]))
  ok(/Ascendant in/.test(withAsc.split('## Planets')[0]))
})

const KYIV = { birthDate: '2004-06-22', birthTime: '08:30', lat: 50.45, lon: 30.52, timeZone: 'Europe/Kyiv' }
const SIGNS_ALL = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
const PLANETS_ALL = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

test('every planet in every sign has its own text, in both languages', () => {
  for (const locale of ['en', 'uk'] as const) {
    const seen = new Set<string>()
    for (const p of PLANETS_ALL) for (const s of SIGNS_ALL) seen.add(placementText(p, s, locale))
    strictEqual(seen.size, 120, locale)
  }
})

test('no sentence repeats across the planets of one report', () => {
  for (const locale of ['en', 'uk'] as const) {
    const lines = buildReport(natalChart(KYIV), locale).text.split('\n').filter((l) => l && !l.startsWith('## '))
    strictEqual(new Set(lines).size, lines.length, locale)
    // три планети в одному знаку (Рак) більше не дають однакового тексту
    const planetsPart = lines.filter((l) => /\(\d+°\):/.test(l))
    strictEqual(new Set(planetsPart.map((l) => l.split('): ')[1])).size, planetsPart.length, locale)
  }
})

test('with birth time and place the report adds houses, the Midheaven and the chart ruler', () => {
  const r = buildReport(natalChart(KYIV), 'en').text
  ok(r.includes('## Houses and angles') && /Midheaven in /.test(r) && /Chart ruler: /.test(r))
  ok(/House \d+:/.test(r), 'planets mention their house')
  const uk = buildReport(natalChart(KYIV), 'uk').text
  ok(uk.includes('## Будинки та кути') && /Управитель карти: /.test(uk) && /-й будинок:/.test(uk))
  ok(!buildReport(natalChart({ birthDate: '2004-06-22' }), 'en').text.includes('Houses and angles'))
})

test('aspect texts depend on the pair of planets, not only on the aspect type', () => {
  const names = (a: string, b: string) => ({ a, b })
  const x = aspectText('Sun', 'Moon', 'square', 3, names('Sun', 'Moon'), 'en')
  const y = aspectText('Venus', 'Mars', 'square', 3, names('Venus', 'Mars'), 'en')
  ok(x !== y)
  ok(aspectText('Sun', 'Moon', 'trine', 0.2, names('Sun', 'Moon'), 'en').includes('very tight'))
  ok(!aspectText('Sun', 'Moon', 'trine', 3, names('Sun', 'Moon'), 'en').includes('very tight'))
})

test('the Sun–Moon relation is classified by element', () => {
  strictEqual(sunMoonRelation('Cancer', 'Cancer'), 'sameSign')
  strictEqual(sunMoonRelation('Cancer', 'Scorpio'), 'sameElement')
  strictEqual(sunMoonRelation('Aries', 'Gemini'), 'friendly')
  strictEqual(sunMoonRelation('Cancer', 'Leo'), 'tense')
})

test('every pair of planets except two slow ones has its own aspect text in both languages', () => {
  const slow = new Set(['Uranus', 'Neptune', 'Pluto'])
  let expected = 0
  for (let i = 0; i < PLANETS_ALL.length; i++)
    for (let j = i + 1; j < PLANETS_ALL.length; j++) {
      if (slow.has(PLANETS_ALL[i]) && slow.has(PLANETS_ALL[j])) continue
      expected++
      const pair = PAIRS[`${PLANETS_ALL[i]}-${PLANETS_ALL[j]}`]
      ok(pair, `${PLANETS_ALL[i]}-${PLANETS_ALL[j]}`)
      ok(pair.ease[0] && pair.ease[1] && (!pair.hard || (pair.hard[0] && pair.hard[1])))
    }
  strictEqual(Object.keys(PAIRS).length, expected)
})

test('the general explanation of an aspect type is given once per report, not on every line', () => {
  const r = buildReport(natalChart(KYIV), 'en').text.split('\n').filter((l) => l.startsWith('- '))
  const trines = r.filter((l) => l.includes(': trine'))
  ok(trines.length >= 2)
  strictEqual(trines.filter((l) => l.includes('comes naturally')).length, 1)
})
