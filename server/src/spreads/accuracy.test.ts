import { describe, test } from 'node:test'
import { deepStrictEqual, strictEqual } from 'node:assert/strict'
import { accuracyOf, isOutcomeDue, OUTCOME_DUE_DAYS } from './accuracy'

const NOW = new Date('2026-11-20T12:00:00Z')
const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000)
const row = (days: number, outcome: string | null, ...ids: number[]) => ({ date: ago(days), outcome, cards: ids.map((id) => ({ id })) })

describe('when to ask "did it come true?"', () => {
  test('only after a week, and only while there is no answer', () => {
    strictEqual(isOutcomeDue(row(OUTCOME_DUE_DAYS - 0.1, null), NOW), false)
    strictEqual(isOutcomeDue(row(OUTCOME_DUE_DAYS, null), NOW), true)
    strictEqual(isOutcomeDue(row(30, 'yes'), NOW), false)
  })
})

describe('accuracy summary', () => {
  test('no readings: all zeros and no percentage', () => {
    deepStrictEqual(accuracyOf([], NOW), { total: 0, answered: 0, yes: 0, partly: 0, no: 0, waiting: 0, rate: null, topCards: [] })
  })

  test('counts answers, waiting readings and the rate (partly counts as half)', () => {
    const s = accuracyOf([row(30, 'yes', 1), row(20, 'yes', 2), row(15, 'partly', 3), row(10, 'no', 4), row(9, null, 5), row(1, null, 6)], NOW)
    strictEqual(s.total, 6)
    strictEqual(s.answered, 4)
    deepStrictEqual([s.yes, s.partly, s.no], [2, 1, 1])
    strictEqual(s.waiting, 1, 'the unanswered reading from 9 days ago waits; the one from yesterday is too early')
    strictEqual(s.rate, 63, '(2 + 0.5) / 4 = 62.5%, rounded')
  })

  test('unknown outcome values are ignored, not counted', () => {
    const s = accuracyOf([row(30, 'maybe', 1)], NOW)
    strictEqual(s.answered, 0)
    strictEqual(s.rate, null)
  })

  test('recurring cards: at least twice, most frequent first, ties by id, at most three', () => {
    const s = accuracyOf([row(30, null, 5, 9, 3), row(20, null, 5, 9, 3), row(10, null, 5, 7), row(5, null, 7, 12), row(4, null, 12, 40)], NOW)
    deepStrictEqual(s.topCards, [{ id: 5, count: 3 }, { id: 3, count: 2 }, { id: 7, count: 2 }])
  })
})
