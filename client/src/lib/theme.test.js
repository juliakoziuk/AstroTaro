import { test } from 'node:test'
import { strictEqual } from 'node:assert/strict'

// браузерне оточення в мініатюрі: сховище, документ і системна тема, яку можна «змінити» з тесту
const store = new Map()
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
globalThis.document = { documentElement: { dataset: {} } }
let systemLight = false
const mediaListeners = []
globalThis.matchMedia = () => ({
  get matches() {
    return systemLight
  },
  addEventListener: (_type, fn) => mediaListeners.push(fn),
})

const { getPreference, getTheme, resolveTheme, setTheme, settingOf, themeFromSetting, toggleTheme } = await import('./theme.js')

test('the app starts dark and marks the document', () => {
  strictEqual(getTheme(), 'dark')
  strictEqual(document.documentElement.dataset.theme, 'dark')
})

test('choosing a theme applies it to the document and remembers it', () => {
  setTheme('light')
  strictEqual(getTheme(), 'light')
  strictEqual(document.documentElement.dataset.theme, 'light')
  strictEqual(store.get('astrotarot.theme'), 'light')
})

test('the toggle flips between dark and light', () => {
  setTheme('dark')
  toggleTheme()
  strictEqual(getTheme(), 'light')
  toggleTheme()
  strictEqual(getTheme(), 'dark')
})

test('an unknown theme is ignored', () => {
  setTheme('dark')
  setTheme('neon')
  strictEqual(getTheme(), 'dark')
  strictEqual(getPreference(), 'dark')
})

test('auto follows the system theme, including when it changes', () => {
  systemLight = true
  setTheme('auto')
  strictEqual(getPreference(), 'auto')
  strictEqual(getTheme(), 'light')
  systemLight = false
  mediaListeners.forEach((fn) => fn())
  strictEqual(getTheme(), 'dark')
  strictEqual(resolveTheme('auto', true), 'light')
})

test('toggling from auto picks the opposite of what is shown now', () => {
  systemLight = false
  setTheme('auto')
  toggleTheme()
  strictEqual(getPreference(), 'light')
})

test('the account setting maps to and from the theme', () => {
  strictEqual(settingOf('dark'), 'Dark')
  strictEqual(settingOf('light'), 'Light')
  strictEqual(settingOf('auto'), 'Auto')
  strictEqual(themeFromSetting('Light'), 'light')
  strictEqual(themeFromSetting('Auto'), 'auto')
  strictEqual(themeFromSetting('whatever'), 'dark')
})
