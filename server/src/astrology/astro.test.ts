import { test } from 'node:test'
import { ok, strictEqual } from 'node:assert/strict'
import { ascendantLongitude, natalChart, nextMoonEvents, signOf } from './astro'

test('signOf maps ecliptic longitude to a zodiac sign', () => {
  strictEqual(signOf(0).sign, 'Aries')
  strictEqual(signOf(91).sign, 'Cancer')
  strictEqual(signOf(359.9).sign, 'Pisces')
})

test('the Sun is in Cancer on 22 June 2004', () => {
  const chart = natalChart({ birthDate: '2004-06-22' })
  strictEqual(chart.planets.length, 10)
  strictEqual(chart.planets.find((p) => p.name === 'Sun')!.sign, 'Cancer')
})

test('without birth time and place there is no ascendant', () => {
  strictEqual(natalChart({ birthDate: '2004-06-22' }).ascendant, null)
})

test('with time and place the ascendant is a sign', () => {
  const a = natalChart({ birthDate: '2004-06-22', birthTime: '08:30', lat: 50.45, lon: 30.52 }).ascendant
  ok(a && a.length > 3)
})

test('local birth time is converted with the time zone of the birthplace', () => {
  const local = natalChart({ birthDate: '2004-06-22', birthTime: '08:30', timeZone: 'Europe/Kyiv', lat: 50.45, lon: 30.52 })
  const utc = natalChart({ birthDate: '2004-06-22', birthTime: '05:30', lat: 50.45, lon: 30.52 })
  strictEqual(JSON.stringify(local), JSON.stringify(utc))
})

test('ascendant formula: RAMC 0 at the equator is 90 degrees', () => {
  ok(Math.abs(ascendantLongitude(0, 0, 23.44) - 90) < 1e-6)
})

test('next moon events are two upcoming new/full moons in date order', () => {
  const ev = nextMoonEvents(new Date('2026-11-03T00:00:00Z'))
  strictEqual(ev.length, 2)
  ok(ev[0].date < ev[1].date && ev[0].date >= '2026-11-03')
  for (const e of ev) ok(['New Moon', 'Full Moon'].includes(e.name))
})
