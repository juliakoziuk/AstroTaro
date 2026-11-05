import { test } from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { progressPercent } from './dashboard'

test('progress is the share of the monthly goal, capped at 100', () => {
  strictEqual(progressPercent(0), 0)
  strictEqual(progressPercent(15), 50)
  strictEqual(progressPercent(99), 100)
})
