import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { natalChart } from './astro'
import { aspectsOf, buildReport, dominant, moonPhaseIndex } from './report'

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
  const es = buildReport(natalChart({ birthDate: '2004-06-22' }), 'es')
  ok(es.text.includes('## Planetas') && es.text.includes('Aspectos clave') && !cyrillic.test(es.text))
})

test('the ascendant is described only when it is known', () => {
  const without = buildReport(natalChart({ birthDate: '2004-06-22' }), 'en').text
  const withAsc = buildReport(natalChart({ birthDate: '2004-06-22', birthTime: '08:30', lat: 50.45, lon: 30.52, timeZone: 'Europe/Kyiv' }), 'en').text
  ok(!/Ascendant in/.test(without.split('## Planets')[0]))
  ok(/Ascendant in/.test(withAsc.split('## Planets')[0]))
})
