import { test } from 'node:test'
import { deepStrictEqual, notStrictEqual, strictEqual } from 'node:assert/strict'
import { limitsOf, planOf, remainingOf, usageWindows } from './limits'
import { plans } from './plans'

test('the three plans have the documented limits', () => {
  deepStrictEqual(limitsOf('free'), { readingsPerMonth: 5, dreamsTotal: 10, aiMessagesPerDay: 10, readingModes: ['quick'], compatibility: false, forecastRanges: ['day'], fullReports: false })
  deepStrictEqual(limitsOf('pro'), { readingsPerMonth: null, dreamsTotal: null, aiMessagesPerDay: 50, readingModes: ['quick', 'detailed'], compatibility: true, forecastRanges: ['day', 'week', 'month'], fullReports: true })
  deepStrictEqual(limitsOf('premium'), { readingsPerMonth: null, dreamsTotal: null, aiMessagesPerDay: 200, readingModes: ['quick', 'detailed', 'depth'], compatibility: true, forecastRanges: ['day', 'week', 'month'], fullReports: true })
})

test('an unknown plan is treated as free, and the returned limits are a copy', () => {
  deepStrictEqual(limitsOf('gold'), limitsOf('free'))
  deepStrictEqual(limitsOf(''), limitsOf('free'))
  strictEqual(planOf('constructor'), 'free', 'prototype names are not plans')
  strictEqual(planOf('pro'), 'pro')
  const mine = limitsOf('free')
  mine.readingModes.push('depth')
  mine.readingsPerMonth = 999
  deepStrictEqual(limitsOf('free').readingModes, ['quick'], 'changing the copy does not change the table')
  strictEqual(limitsOf('free').readingsPerMonth, 5)
})

test('each higher plan includes everything of the lower one', () => {
  const [free, pro, premium] = ['free', 'pro', 'premium'].map(limitsOf)
  for (const [lower, higher] of [[free, pro], [pro, premium]] as const) {
    for (const mode of lower.readingModes) strictEqual(higher.readingModes.includes(mode), true)
    for (const range of lower.forecastRanges) strictEqual(higher.forecastRanges.includes(range), true)
    strictEqual(!lower.compatibility || higher.compatibility, true)
    strictEqual(!lower.fullReports || higher.fullReports, true)
    for (const key of ['readingsPerMonth', 'dreamsTotal', 'aiMessagesPerDay'] as const) {
      strictEqual(higher[key] === null || (lower[key] !== null && higher[key]! >= lower[key]!), true, key)
    }
  }
})

test('what is left: never negative, null for unlimited', () => {
  const usage = { readingsThisMonth: 2, dreamsTotal: 12, aiMessagesToday: 10 }
  deepStrictEqual(remainingOf(limitsOf('free'), usage), { readings: 3, dreams: 0, aiMessages: 0 })
  deepStrictEqual(remainingOf(limitsOf('pro'), usage), { readings: null, dreams: null, aiMessages: 40 })
})

test('usage windows are calendar month and day in UTC', () => {
  const w = usageWindows(new Date('2026-11-09T17:30:00Z'))
  strictEqual(w.monthStart.toISOString(), '2026-11-01T00:00:00.000Z')
  strictEqual(w.readings.toISOString(), '2026-12-01T00:00:00.000Z')
  strictEqual(w.dayStart.toISOString(), '2026-11-09T00:00:00.000Z')
  strictEqual(w.aiMessages.toISOString(), '2026-11-10T00:00:00.000Z')
})

test('windows roll over correctly at the end of a month, a year and in a leap year', () => {
  const yearEnd = usageWindows(new Date('2026-12-31T23:59:59.999Z'))
  strictEqual(yearEnd.readings.toISOString(), '2027-01-01T00:00:00.000Z')
  strictEqual(yearEnd.aiMessages.toISOString(), '2027-01-01T00:00:00.000Z')
  const leap = usageWindows(new Date('2028-02-29T12:00:00Z'))
  strictEqual(leap.dayStart.toISOString(), '2028-02-29T00:00:00.000Z')
  strictEqual(leap.aiMessages.toISOString(), '2028-03-01T00:00:00.000Z')
  strictEqual(leap.readings.toISOString(), '2028-03-01T00:00:00.000Z')
  const first = usageWindows(new Date('2026-03-01T00:00:00.000Z'))
  strictEqual(first.monthStart.toISOString(), '2026-03-01T00:00:00.000Z', 'the first instant of a month belongs to that month')
})

test('GET /plans carries the limits, and the feature lists keep the lengths the pricing plate has room for', () => {
  const list = plans('en')
  deepStrictEqual(list.map((p) => p.id), ['free', 'pro', 'premium'])
  for (const p of list) deepStrictEqual(p.limits, limitsOf(p.id))
  deepStrictEqual(list.map((p) => p.features.length), [3, 4, 4], 'the painted pricing cards bind exactly 3, 4 and 4 feature lines')
  const uk = plans('uk')
  for (let i = 0; i < 3; i++) notStrictEqual(uk[i].features.join(), list[i].features.join(), 'every feature line has a Ukrainian text')
})
