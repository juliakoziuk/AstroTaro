// Де лежить токен входу. «Запам'ятати мене» → localStorage (переживає закриття браузера, токен на сервері довгий);
// без нього → sessionStorage (токен живе, поки відкрита вкладка). Прострочений токен вважаємо відсутнім.
const KEY = 'astrotarot.token'
const MS_PER_SECOND = 1000
const JWT_PAYLOAD_PART = 1

const stores = () => [globalThis.localStorage, globalThis.sessionStorage].filter(Boolean)

/** Токен прострочений, якщо в його payload є exp у минулому; не-JWT (або без exp) прострочкою не вважаємо. */
function isExpired(token) {
  try {
    const payload = token.split('.')[JWT_PAYLOAD_PART].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload))
    return typeof exp === 'number' && exp * MS_PER_SECOND <= Date.now()
  } catch {
    return false
  }
}

export const signOut = () => stores().forEach((store) => store.removeItem(KEY))

export function getToken() {
  for (const store of stores()) {
    const token = store.getItem(KEY)
    if (!token) continue
    if (!isExpired(token)) return token
    store.removeItem(KEY)
  }
  return null
}

export function setToken(token, remember = true) {
  signOut()
  const store = remember ? globalThis.localStorage : (globalThis.sessionStorage ?? globalThis.localStorage)
  store.setItem(KEY, token)
}
