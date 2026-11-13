import { get, signOut } from '../../lib/api.js'

// Те, що екрани передають один одному в межах сесії вкладки: який сон/розклад/персона вибрані
export const session = {
  get(key) {
    try {
      return sessionStorage.getItem(`astrotarot.${key}`)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(`astrotarot.${key}`, value)
    } catch {
      /* без сховища просто не запам'ятовуємо вибір */
    }
  },
}

export const loadSettings = () => get('/settings')

/** Рядок пошуку → query-рядок списку: «#море» — фільтр за тегом, решта — пошук за текстом; порожній рядок — без параметрів. */
export function searchQuery(input) {
  const text = String(input ?? '').trim()
  if (!text) return ''
  return text.startsWith('#') && text.length > 1 ? `?tag=${encodeURIComponent(text.slice(1).trim())}` : `?q=${encodeURIComponent(text)}`
}

/** Вихід з акаунта: забуває токен і вибір поточного сну/розкладу, далі екран веде на вхід. */
export function logOut() {
  signOut()
  session.set('readingId', '')
  session.set('dreamId', '')
}

/** Специфікація прив’язки для списку з однаковими слотами: [назва, ...] → ключі `${prefix}${i}.${field}`. */
export const slots = (prefix, rows, fields) =>
  rows.flatMap((orig, i) => orig.map((find, j) => ({ find, key: `${prefix}${i}.${fields[j]}` })))
