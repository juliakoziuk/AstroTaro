import { test } from 'node:test'
import { strictEqual } from 'node:assert/strict'

globalThis.document = { documentElement: {} }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const { searchQuery } = await import('./common.js')

test('an empty search gives no query', () => {
  strictEqual(searchQuery(''), '')
  strictEqual(searchQuery('   '), '')
  strictEqual(searchQuery(null), '')
})

test('plain text is a text search, encoded and trimmed', () => {
  strictEqual(searchQuery(' whale '), '?q=whale')
  strictEqual(searchQuery('100% sure & more'), '?q=100%25%20sure%20%26%20more')
  strictEqual(searchQuery('кит'), '?q=' + encodeURIComponent('кит'))
})

test('#word is a tag filter', () => {
  strictEqual(searchQuery('#sea'), '?tag=sea')
  strictEqual(searchQuery('#  вода '), '?tag=' + encodeURIComponent('вода'))
})

test('a lone # is searched as text', () => {
  strictEqual(searchQuery('#'), '?q=%23')
})
