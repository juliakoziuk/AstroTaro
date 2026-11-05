import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { analyzeDream } from './analysis'

test('finds symbols from the dream text and title', () => {
  const r = analyzeDream('The Old House', 'I was in an old house from my childhood. I found a room with a bright light inside.', 'en')
  for (const s of ['House', 'Childhood', 'Light']) ok(r.symbols.includes(s), s)
  ok(r.keyMeanings.length >= 1)
  ok(r.interpretation.length > 20)
})

test('a dream without known symbols still gets a gentle generic reading', () => {
  const r = analyzeDream('Plain', 'Nothing much happened.', 'en')
  deepStrictEqual(r.symbols, [])
  ok(r.interpretation.length > 0)
})

test('lucid and nightmare kinds are detected', () => {
  strictEqual(analyzeDream('x', 'I realised I was dreaming and took control.', 'en').kind, 'Lucid Dream')
  strictEqual(analyzeDream('x', 'A terrifying monster chased me, I was afraid.', 'en').kind, 'Nightmare')
  strictEqual(analyzeDream('x', 'I walked in a park.', 'en').kind, 'Dream')
})

test('short words do not match inside longer ones', () => {
  deepStrictEqual(analyzeDream('x', 'I did a search for the season.', 'en').symbols, ['Search'])
})
