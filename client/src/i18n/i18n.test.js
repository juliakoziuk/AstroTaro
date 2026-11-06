import { test } from 'node:test'
import { strictEqual } from 'node:assert/strict'

const store = new Map()
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
globalThis.document = { documentElement: {} }
Object.defineProperty(globalThis, 'navigator', { value: { language: 'uk-UA' }, configurable: true })

const { getLang, langFromSetting, LANGS, setLang, settingOf, t, tr } = await import('./index.js')

test('the first language comes from the browser when nothing is saved', () => {
  strictEqual(getLang(), 'uk')
})

test('setLang switches the language, remembers it and marks the document', () => {
  setLang('en')
  strictEqual(getLang(), 'en')
  strictEqual(store.get('astrotarot.lang'), 'en')
  strictEqual(document.documentElement.lang, 'en')
})

test('an unknown language is ignored', () => {
  setLang('xx')
  setLang('es')
  strictEqual(getLang(), 'en')
})

test('t translates by the English text, falls back to it and fills {vars}', () => {
  setLang('uk')
  strictEqual(t('Home'), 'Головна')
  strictEqual(t('Some text nobody translated'), 'Some text nobody translated')
  strictEqual(t('Plan: {name}', { name: 'Pro' }), 'Тариф: Pro')
  setLang('en')
  strictEqual(t('Home'), 'Home')
})

test('tr(lang) translates into a given language without switching', () => {
  strictEqual(tr('uk')('Home'), 'Головна')
  strictEqual(getLang(), 'en')
})

test('settings names map to language ids and back', () => {
  strictEqual(langFromSetting('Ukrainian'), 'uk')
  strictEqual(langFromSetting('Spanish'), 'en')
  strictEqual(langFromSetting('nonsense'), 'en')
  strictEqual(settingOf('uk'), 'Ukrainian')
  strictEqual(LANGS.length, 2)
})
