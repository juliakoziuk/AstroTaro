import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { isPlausibleToday, isRealDay, recentDays, shiftDay, streakOf } from './streak'
import { presentDaily } from './daily'

test('shiftDay crosses month, year and leap-day borders', () => {
  strictEqual(shiftDay('2026-03-01', -1), '2026-02-28')
  strictEqual(shiftDay('2028-03-01', -1), '2028-02-29')
  strictEqual(shiftDay('2026-12-31', 1), '2027-01-01')
})

test('only real calendar days are accepted', () => {
  ok(isRealDay('2028-02-29'))
  ok(!isRealDay('2026-02-29'))
  ok(!isRealDay('2026-13-01'))
  ok(!isRealDay('26-1-1'))
})

test('the client date must be a moment that exists somewhere on Earth now', () => {
  const now = new Date('2026-11-11T23:30:00Z')
  ok(isPlausibleToday('2026-11-11', now))
  ok(isPlausibleToday('2026-11-12', now), 'already tomorrow in the far east')
  ok(isPlausibleToday('2026-11-10', now), 'still yesterday in the far west')
  ok(!isPlausibleToday('2026-11-13', now))
  ok(!isPlausibleToday('2026-11-09', now))
  ok(!isPlausibleToday('2026-02-31', now))
})

test('no cards means no streak', () => {
  deepStrictEqual(streakOf([], '2026-11-11'), { current: 0, longest: 0, total: 0, drawnToday: false })
})

test('days in a row up to today make the current streak', () => {
  const s = streakOf(['2026-11-09', '2026-11-10', '2026-11-11'], '2026-11-11')
  deepStrictEqual(s, { current: 3, longest: 3, total: 3, drawnToday: true })
})

test('the streak stays alive until the end of today if yesterday was drawn', () => {
  const s = streakOf(['2026-11-09', '2026-11-10'], '2026-11-11')
  deepStrictEqual(s, { current: 2, longest: 2, total: 2, drawnToday: false })
})

test('a missed day resets the current streak but keeps the best one', () => {
  const s = streakOf(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-08', '2026-11-09'], '2026-11-11')
  deepStrictEqual(s, { current: 0, longest: 4, total: 6, drawnToday: false })
  strictEqual(streakOf(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-10', '2026-11-11'], '2026-11-11').current, 2)
})

test('order and duplicates do not matter', () => {
  const s = streakOf(['2026-11-11', '2026-11-09', '2026-11-10', '2026-11-10'], '2026-11-11')
  deepStrictEqual(s, { current: 3, longest: 3, total: 3, drawnToday: true })
})

test('the streak runs across a month and a year border', () => {
  strictEqual(streakOf(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-01').current, 3)
})

test('recentDays lists the last week oldest first and marks the drawn ones', () => {
  const week = recentDays(['2026-11-11', '2026-11-09'], '2026-11-11')
  strictEqual(week.length, 7)
  strictEqual(week[0].date, '2026-11-05')
  strictEqual(week[6].date, '2026-11-11')
  deepStrictEqual(week.filter((d) => d.drawn).map((d) => d.date), ['2026-11-09', '2026-11-11'])
})

test('the card of the day reads cleanly in every language for every card and position', () => {
  for (const locale of ['en', 'uk'] as const)
    for (let cardId = 0; cardId < 78; cardId++)
      for (const reversed of [false, true]) {
        const d = presentDaily({ day: '2026-11-11', cardId, reversed }, locale)
        ok(d.name && d.meaning && d.text, `${locale}/${cardId}`)
        ok(!/undefined|\{|\}|NaN/.test(`${d.meaning} ${d.text}`), `${locale}/${cardId}/${reversed}: ${d.text}`)
        strictEqual(d.reversed, reversed)
      }
})
