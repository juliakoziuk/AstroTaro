// Єдиний клієнт до NestJS API (server/): токен у localStorage, мова інтерфейсу в Accept-Language,
// помилки як Error з повідомленням сервера (вже мовою інтерфейсу).
import { getLang } from '../i18n/index.js'
import { getToken, signOut } from './tokenStore.js'

export { getToken, setToken, signOut } from './tokenStore.js'

const API = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api'

let onUnauthorized = () => {}
/** Що робити, коли сервер відхилив токен (простіше кажучи — викинути на вхід). */
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

// Один екран із кількох місць питає те саме (/settings тричі, /auth/me тричі, /dashboard двічі): мова, тема, шлюз онбордингу, нагадування,
// бічна панель. Однакові GET за кілька секунд віддаємо з одного запиту. Будь-яка зміна (не GET) скидає все, тож застарілого не побачимо.
const GET_REUSE_MS = 3000
const recent = new Map() // токен|мова|шлях → { at, promise }

/** Забути запам'ятовані GET (для тестів: кожен починає з чистого аркуша). */
export const forgetRecentGets = () => recent.clear()

export async function api(method, path, body) {
  if (method !== 'GET') {
    recent.clear()
    try {
      return await send(method, path, body)
    } finally {
      recent.clear() // GET, що стартував під час зміни, міг прочитати старе
    }
  }
  return send(method, path, body)
}

async function send(method, path, body) {
  const token = getToken()
  let res
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept-Language': getLang(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('Не вдалося зʼєднатися з сервером')
  }
  const data = await res.json().catch(() => null)
  if (res.status === 401 && token) {
    signOut()
    onUnauthorized()
  }
  if (!res.ok) {
    // код (наприклад PLAN_LIMIT) і тіло відповіді лишаються на помилці: екран може запропонувати тарифи, а не лише показати текст
    const error = new Error([].concat(data?.message ?? 'Щось пішло не так').join(', '))
    error.status = res.status
    error.code = data?.code
    error.data = data
    throw error
  }
  return data
}

export function get(path) {
  const key = `${getToken() ?? ''}|${getLang()}|${path}`
  const hit = recent.get(key)
  if (hit && Date.now() - hit.at < GET_REUSE_MS) return hit.promise.then(structuredClone) // кожен отримувач має власну копію
  const promise = api('GET', path)
  recent.set(key, { at: Date.now(), promise })
  promise.catch(() => recent.get(key)?.promise === promise && recent.delete(key)) // помилку не запам'ятовуємо
  return promise.then(structuredClone)
}
export const post = (path, body = {}) => api('POST', path, body)
export const patch = (path, body) => api('PATCH', path, body)
export const del = (path) => api('DELETE', path)
