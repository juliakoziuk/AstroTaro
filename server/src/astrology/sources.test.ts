import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { natalChart } from './astro'
import { aspectsOf } from './report'
import { excerpt, loadCorpus, natalSources, Passage, sourcesBlock } from './sources'

const FULL = { birthDate: '1990-05-05', birthTime: '12:00', lat: 50.45, lon: 30.52, timeZone: 'Europe/Kyiv' }
const DATE_ONLY = { birthDate: '1990-05-05' }
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

let n = 0
const passage = (extra: Partial<Passage>): Passage => ({ id: `t:${++n}`, source: 'leo-afa-1899', title: 'Alan Leo, Astrology for All', year: 1899, kind: 'sign', planet: 'Sun', words: 5, text: 'a short test passage of text', ...extra })

test('the real corpus is in the repository and holds what the builder reported', () => {
  const corpus = loadCorpus()
  ok(corpus.length > 300, `passages: ${corpus.length}`)
  for (const sign of SIGNS) {
    for (const planet of ['Sun', 'Moon']) ok(corpus.some((p) => p.kind === 'sign' && p.planet === planet && p.sign === sign), `${planet} in ${sign}`)
  }
  ok(corpus.filter((p) => p.kind === 'combo').length >= 100, 'Sun-sign x Moon-sign pairs')
  ok(corpus.filter((p) => p.kind === 'house').length >= 50)
  ok(corpus.filter((p) => p.kind === 'aspect').length >= 30)
  strictEqual(new Set(corpus.map((p) => p.id)).size, corpus.length, 'ids are unique')
  for (const p of corpus) ok(p.text.length > 20 && p.title && p.year > 1800, p.id)
})

test('the corpus loads from a folder, skips a broken file and gives nothing for a missing folder', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'corpus-'))
  try {
    writeFileSync(path.join(dir, 'good.json'), JSON.stringify([passage({ id: 'good:1' })]))
    writeFileSync(path.join(dir, 'broken.json'), '{ not json')
    writeFileSync(path.join(dir, 'notes.txt'), 'ignored')
    deepStrictEqual(loadCorpus(dir).map((p) => p.id), ['good:1'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  deepStrictEqual(loadCorpus(path.join(tmpdir(), 'no-such-corpus-folder')), [])
})

test('without a corpus there are no sources', () => {
  deepStrictEqual(natalSources(natalChart(FULL), []), [])
  strictEqual(sourcesBlock([], 'en'), '')
})

test('for a real chart the picks are about its own placements, without repeats, and houses only with a birth time', () => {
  const chart = natalChart(FULL)
  const picks = natalSources(chart)
  ok(picks.length >= 3 && picks.length <= 30, `picks: ${picks.length}`)
  strictEqual(new Set(picks.map((p) => p.passage.id)).size, picks.length)
  const [sun, moon] = chart.planets
  ok(picks.some((p) => p.passage.planet === 'Sun' && (p.passage.sign === sun.sign)), 'the Sun sign is covered')
  ok(picks.some((p) => (p.passage.planet === 'Moon' && p.passage.sign === moon.sign) || (p.passage.kind === 'combo' && p.passage.sign2 === moon.sign)), 'the Moon sign is covered')
  for (const { passage } of picks) {
    if (passage.kind === 'sign') strictEqual(passage.sign, chart.planets.find((p) => p.name === passage.planet)!.sign, 'a sign passage matches the chart: ' + passage.id)
    if (passage.kind === 'house') strictEqual(passage.house, chart.planets.find((p) => p.name === passage.planet)!.house, 'a house passage matches the chart: ' + passage.id)
  }
  ok(picks.some((p) => p.passage.kind === 'house'), 'houses are used when the birth time is known')
  const noTime = natalSources(natalChart(DATE_ONLY))
  ok(noTime.length >= 2)
  ok(!noTime.some((p) => p.passage.kind === 'house'), 'no house passage without a birth time')
})

test('the pair of Sun and Moon signs comes first, and the single passages replace it only when the pair is missing', () => {
  const chart = natalChart(FULL)
  const [sun, moon] = chart.planets
  const combo = passage({ kind: 'combo', planet: 'Sun', sign: sun.sign, planet2: 'Moon', sign2: moon.sign, id: 'c' })
  const sunSign = passage({ kind: 'sign', planet: 'Sun', sign: sun.sign, id: 's1' })
  const sunSign2 = passage({ kind: 'sign', planet: 'Sun', sign: sun.sign, id: 's2', source: 'leo-key-1920', year: 1920 })
  const moonSign = passage({ kind: 'sign', planet: 'Moon', sign: moon.sign, id: 'm1' })
  const withPair = natalSources(chart, [sunSign, sunSign2, moonSign, combo])
  deepStrictEqual(withPair.map((p) => p.passage.id), ['c', 's1', 'm1'])
  strictEqual(withPair[0].label, `Sun in ${sun.sign} + Moon in ${moon.sign}`)
  const withoutPair = natalSources(chart, [sunSign, sunSign2, moonSign])
  deepStrictEqual(withoutPair.map((p) => p.passage.id).sort(), ['m1', 's1', 's2'], 'the second book is used when there is no pair')
})

test('the other planets, the houses and the aspects are matched to the chart, and an aspect works in either direction', () => {
  const chart = natalChart(FULL)
  const venus = chart.planets.find((p) => p.name === 'Venus')!
  const moon = chart.planets[1]
  const aspect = aspectsOf(chart.planets, 14).find((a) => ['trine', 'sextile', 'square', 'opposition', 'conjunction'].includes(a.type))!
  const nature = aspect.type === 'conjunction' ? 'conjunction' : aspect.type === 'trine' || aspect.type === 'sextile' ? 'benefic' : 'adverse'
  const corpus = [
    passage({ id: 'v', kind: 'sign', planet: 'Venus', sign: venus.sign }),
    passage({ id: 'vx', kind: 'sign', planet: 'Venus', sign: SIGNS.find((s) => s !== venus.sign)! }), // чужий знак
    passage({ id: 'h', kind: 'house', planet: 'Moon', house: moon.house! }),
    passage({ id: 'hx', kind: 'house', planet: 'Moon', house: (moon.house! % 12) + 1 }), // чужий будинок
    passage({ id: 'a', kind: 'aspect', planet: aspect.b, with: aspect.a, nature }), // планети навпаки
    passage({ id: 'ax', kind: 'aspect', planet: aspect.b, with: aspect.a, nature: nature === 'adverse' ? 'benefic' : 'adverse' }), // інший характер
  ]
  const ids = natalSources(chart, corpus).map((p) => p.passage.id)
  ok(ids.includes('v') && !ids.includes('vx'), 'Venus: only its own sign')
  ok(ids.includes('h') && !ids.includes('hx'), 'the Moon: only its own house')
  ok(ids.includes('a') && !ids.includes('ax'), 'the aspect: either direction, only the right nature')
})

test('at most six aspect passages are used', () => {
  const chart = natalChart(FULL)
  const corpus: Passage[] = []
  for (const a of aspectsOf(chart.planets, 14)) {
    const nature = a.type === 'conjunction' ? 'conjunction' : a.type === 'trine' || a.type === 'sextile' ? 'benefic' : 'adverse'
    corpus.push(passage({ kind: 'aspect', planet: a.a, with: a.b, nature }))
  }
  ok(natalSources(chart, corpus).length <= 6)
})

test('an excerpt keeps the start of a long passage', () => {
  strictEqual(excerpt('one two three', 5), 'one two three')
  strictEqual(excerpt('one two three four five six', 3), 'one two three…')
})

test('the sources block lists the books once and the placements in the language of the reader', () => {
  const picks = [
    { label: 'x', passage: passage({ kind: 'combo', planet: 'Sun', sign: 'Leo', planet2: 'Moon', sign2: 'Taurus' }) },
    { label: 'x', passage: passage({ kind: 'sign', planet: 'Venus', sign: 'Gemini' }) },
    { label: 'x', passage: passage({ kind: 'house', planet: 'Moon', house: 7, source: 'leo-key-1920', year: 1920, title: 'Alan Leo, The Key to Your Own Nativity' }) },
    { label: 'x', passage: passage({ kind: 'aspect', planet: 'Sun', with: 'Saturn', nature: 'adverse', source: 'leo-key-1920', year: 1920 }) },
  ]
  const uk = sourcesBlock(picks, 'uk')
  ok(uk.startsWith('## Джерела\n'))
  strictEqual((uk.match(/Astrology for All \(1899\)/g) ?? []).length, 1, 'a book is listed once')
  ok(uk.includes('The Key to Your Own Nativity (1920)'))
  ok(/Сонце — Лев \+ Місяць — Телець/.test(uk) && /Венера — Близнюки/.test(uk) && /Місяць, будинок 7/.test(uk) && /Сонце — Сатурн/.test(uk), uk)
  ok(/не передбачення/.test(uk))
  const en = sourcesBlock(picks, 'en')
  ok(en.startsWith('## Sources\n') && /Moon, house 7/.test(en) && /not a prediction/.test(en))
})
