// Тема застосунку: 'dark' | 'light' | 'auto' (за системою). Уподобання зберігається в localStorage, а в залогіненого
// користувача ще й у його налаштуваннях на сервері (поле «Theme»: Dark | Light | Auto, див. themeSync.js).
// Показана тема (getTheme) завжди 'dark' або 'light': вона стоїть атрибутом data-theme на <html>, а стилі світлої теми
// (src/app/theme.css) спираються на цей атрибут.
import { useSyncExternalStore } from 'react'

const KEY = 'astrotarot.theme'
const PREFERENCES = ['dark', 'light', 'auto']
const SETTING = { dark: 'Dark', light: 'Light', auto: 'Auto' }

const read = () => {
  try {
    const saved = localStorage.getItem(KEY)
    if (PREFERENCES.includes(saved)) return saved
  } catch {
    /* без сховища беремо темну тему */
  }
  return 'dark'
}

const lightQuery = () => globalThis.matchMedia?.('(prefers-color-scheme: light)')
export const resolveTheme = (preference, systemIsLight = lightQuery()?.matches ?? false) => (preference === 'auto' ? (systemIsLight ? 'light' : 'dark') : preference)

let preference = read()
let theme = resolveTheme(preference)
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

function apply() {
  theme = resolveTheme(preference)
  if (globalThis.document) document.documentElement.dataset.theme = theme
}
apply()

// режим «Авто»: системна тема змінилась — перемальовуємо
lightQuery()?.addEventListener?.('change', () => {
  if (preference !== 'auto') return
  apply()
  emit()
})

export const getTheme = () => theme
export const getPreference = () => preference

export function setTheme(next) {
  if (!PREFERENCES.includes(next) || next === preference) return
  preference = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* не запам'ятовуємо, але тему застосовуємо */
  }
  apply()
  emit()
}

/** Перемикач: з показаної теми на протилежну (з «Авто» теж: береться те, що видно зараз). */
export const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

export const useTheme = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    getTheme,
  )

export const settingOf = (value) => SETTING[value] ?? 'Dark'
export const themeFromSetting = (setting) => PREFERENCES.find((p) => SETTING[p] === setting) ?? 'dark'
