// Тонка обгортка над fetch для MYSTIQ API. Токен живе в localStorage.

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const TOKEN_KEY = 'mystiq-token'

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      // сховище недоступне — сесія діятиме лише до перезавантаження
    }
  },
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Викликається, коли сервер відхилив токен (протермінований чи недійсний)
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

async function request(method, path, body) {
  const token = tokenStore.get()
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Не вдалося зв’язатися з сервером')
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // Помилки валідації приходять масивом рядків
    const msg = Array.isArray(data?.message) ? data.message.join('; ') : data?.message
    // 401 на /auth/login означає «невірний пароль», а не «сесія померла»
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(res.status, msg || 'Щось пішло не так')
  }
  return data
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
}

// Фронт називає свою репліку role: 'me', сервер — 'user'
export const msgFromApi = (m) => ({ ...m, role: m.role === 'user' ? 'me' : m.role })
export const msgToApi = (m) => ({ role: m.role === 'me' ? 'user' : m.role, text: m.text })
