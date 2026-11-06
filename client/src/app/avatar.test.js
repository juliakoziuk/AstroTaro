import { test } from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { initialOf } from './avatar.js'

test('the avatar shows the first letter of the name, in capitals', () => {
  strictEqual(initialOf('юлічка'), 'Ю')
  strictEqual(initialOf('  anna'), 'A')
  strictEqual(initialOf('Édith'), 'É')
})

test('an empty or missing name gives no letter', () => {
  strictEqual(initialOf(''), '')
  strictEqual(initialOf(null), '')
  strictEqual(initialOf(undefined), '')
})

test('an emoji at the start stays whole instead of splitting a surrogate pair', () => {
  strictEqual(initialOf('🌙 Moon'), '🌙')
})
