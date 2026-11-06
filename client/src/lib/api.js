// Єдиний клієнт до NestJS API (server/): токен у localStorage, мова інтерфейсу в Accept-Language,
// помилки як Error з повідомленням сервера (вже мовою інтерфейсу).
import { getLang } from '../i18n/index.js'

const API = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api'
const KEY = 'astrotarot.token'

let onUnauthorized = () => {}
/** Що робити, коли сервер відхилив токен (простіше кажучи — викинути на вхід). */
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

export const getToken = () => localStorage.getItem(KEY)
export const setToken = (token) => localStorage.setItem(KEY, token)
export const signOut = () => localStorage.removeItem(KEY)

export async function api(method, path, body) {
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
  if (!res.ok) throw new Error([].concat(data?.message ?? 'Щось пішло не так').join(', '))
  return data
}

export const get = (path) => api('GET', path)
export const post = (path, body = {}) => api('POST', path, body)
export const patch = (path, body) => api('PATCH', path, body)
export const del = (path) => api('DELETE', path)
