import { test } from 'node:test'
import { ok, strictEqual } from 'node:assert/strict'
import { ALL_PLAIN, plainOf } from './plain'
import { CARD_COUNT } from './cards'
import { LOCALES } from '../i18n/locale'

test('every card has all four texts in every language', () => {
  strictEqual(ALL_PLAIN.length, CARD_COUNT)
  for (let id = 0; id < CARD_COUNT; id++) {
    strictEqual(ALL_PLAIN[id].length, 8, `card ${id}`)
    for (const l of LOCALES) for (const [k, v] of Object.entries(plainOf(id, l))) ok(v.length > 12, `${id}/${l}/${k}`)
  }
})

test('the texts are plain: no template leftovers, no abstract filler, no sentence-final dots', () => {
  for (let id = 0; id < CARD_COUNT; id++)
    for (const l of LOCALES)
      for (const [k, v] of Object.entries(plainOf(id, l))) {
        ok(!/undefined|\{|\}|\.$/.test(v), `${id}/${l}/${k}: ${v}`)
        ok(!/світл|тін[іь]|light and shadow|\bshadow\b/i.test(v), `${id}/${l}/${k} uses light and shadow: ${v}`)
      }
})

test('a card reads differently upright and reversed, and no two cards share a text', () => {
  for (const l of LOCALES) {
    const seen = new Set<string>()
    for (let id = 0; id < CARD_COUNT; id++) {
      const p = plainOf(id, l)
      ok(p.up !== p.rev, `${id}/${l}`)
      for (const v of [p.up, p.rev, p.scene]) {
        ok(!seen.has(v), `duplicate text: ${v}`)
        seen.add(v)
      }
    }
  }
})
