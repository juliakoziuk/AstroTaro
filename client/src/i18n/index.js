// Мова інтерфейсу. Ключ перекладу — англійський текст (він же запасний варіант); словники: uk.js.
// Мова зберігається в localStorage, а залогіненого користувача — ще й у його налаштуваннях на сервері (поле «Language»).
import { useSyncExternalStore } from 'react'
import uk from './uk.js'

const KEY = 'astrotarot.lang'
const DICT = { uk }

/** id — код мови; setting — значення поля «Language» у налаштуваннях сервера; label — самоназва для вибору. */
export const LANGS = [
  { id: 'en', setting: 'English', label: 'English' },
  { id: 'uk', setting: 'Ukrainian', label: 'Українська' },
]

const known = (id) => LANGS.some((l) => l.id === id)
export const langFromSetting = (name) => LANGS.find((l) => l.setting === name)?.id ?? 'en'
export const settingOf = (id) => LANGS.find((l) => l.id === id)?.setting ?? 'English'

function initial() {
  try {
    const saved = localStorage.getItem(KEY)
    if (known(saved)) return saved
  } catch {
    /* без сховища беремо мову браузера */
  }
  const guess = String(globalThis.navigator?.language ?? 'en').slice(0, 2).toLowerCase()
  return known(guess) ? guess : 'en'
}

let lang = initial()
if (globalThis.document) document.documentElement.lang = lang
const listeners = new Set()

export const getLang = () => lang

export function setLang(id) {
  if (!known(id) || id === lang) return
  lang = id
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* вибір діятиме до перезавантаження */
  }
  if (globalThis.document) document.documentElement.lang = id
  listeners.forEach((l) => l())
}

export const useLang = () =>
  useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => lang,
    () => 'en',
  )

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : s)

/** Підпис варіанта в списку: назви мов — самоназви, решта перекладається. */
export const optionLabel = (selectId, value) => (selectId === 'lang' ? (LANGS.find((l) => l.setting === value)?.label ?? value) : t(value))

/** Переклад у вказану мову (функція, зручна в чистій логіці й тестах). */
export const tr = (id) => (key, vars) => fill(DICT[id]?.[key] ?? key, vars)

/** Переклад у поточну мову. Компоненти мають викликати useLang(), щоб перемальовуватись при зміні мови. */
export const t = (key, vars) => tr(lang)(key, vars)
