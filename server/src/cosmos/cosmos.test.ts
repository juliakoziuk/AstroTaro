import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { artQuery } from './art'
import { TtlCache } from './http'
import { parseNominatim } from './geo'
import { upcomingHolidays } from './holidays'
import { localToUtc, zoneAt } from './timezone'

test('zoneAt finds the IANA zone from coordinates', () => {
  ok(['Europe/Kyiv', 'Europe/Kiev'].includes(zoneAt(50.45, 30.52)))
  strictEqual(zoneAt(40.71, -74.0), 'America/New_York')
})

test('local birth time becomes UTC using the zone offset on that date (summer, winter)', () => {
  strictEqual(localToUtc('2004-06-22', '08:30', 'Europe/Kyiv').toISOString(), '2004-06-22T05:30:00.000Z')
  strictEqual(localToUtc('2004-01-15', '08:30', 'Europe/Kyiv').toISOString(), '2004-01-15T06:30:00.000Z')
})

test('historical offsets are honoured (Soviet summer time was UTC+4)', () => {
  strictEqual(localToUtc('1985-07-01', '08:30', 'Europe/Kyiv').toISOString(), '1985-07-01T04:30:00.000Z')
})

test('a zone without DST keeps a fixed offset', () => {
  strictEqual(localToUtc('2020-03-01', '12:00', 'Asia/Kolkata').toISOString(), '2020-03-01T06:30:00.000Z')
})

test('parseNominatim keeps name, numeric coordinates and an upper-case country code', () => {
  const r = parseNominatim([{ display_name: 'Kyiv, Ukraine', lat: '50.45', lon: '30.52', address: { country_code: 'ua' } }, { display_name: 'bad', lat: 'x', lon: '1' }])
  deepStrictEqual(r, [{ name: 'Kyiv, Ukraine', lat: 50.45, lon: 30.52, country: 'UA' }])
})

test('upcomingHolidays returns the next n holidays from today, in order', () => {
  const list = [{ date: '2026-01-01', localName: 'A' }, { date: '2026-12-25', localName: 'C' }, { date: '2026-11-10', localName: 'B' }]
  deepStrictEqual(upcomingHolidays(list, '2026-11-03', 2).map((h) => h.date), ['2026-11-10', '2026-12-25'])
})

test('artQuery maps dream symbols to museum-friendly search words', () => {
  strictEqual(artQuery('Water'), 'sea')
  strictEqual(artQuery('Unknown thing'), 'night sky')
})

test('TtlCache serves a value until it expires', async () => {
  const c = new TtlCache<number>(30)
  c.set('k', 1)
  strictEqual(c.get('k'), 1)
  await new Promise((r) => setTimeout(r, 50))
  strictEqual(c.get('k'), undefined)
})
