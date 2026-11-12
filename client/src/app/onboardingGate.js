import { useEffect, useReducer } from 'react'
import { get, getToken } from '../lib/api.js'

// Чи пройшла людина онбординг: питаємо сервер один раз на токен і запам'ятовуємо, щоб не питати на кожному екрані.
// Токен — ключ, тож інший акаунт у тій самій вкладці перевіряється заново.
const known = new Map() // token → true (пройдено) | false (треба показати)

/** Онбординг пройдено або пропущено: більше не питаємо й не перенаправляємо. */
export const markOnboarded = () => {
  const token = getToken()
  if (token) known.set(token, true)
}

/** true — пройдено, false — треба показати, undefined — сервер ще відповідає. Без входу завжди true. */
export function useOnboarded() {
  const token = getToken()
  const [, rerender] = useReducer((n) => n + 1, 0)
  useEffect(() => {
    if (!token || known.has(token)) return undefined
    let live = true
    get('/auth/me')
      .then((user) => known.set(token, !!user.onboarded))
      // не вдалося дізнатись (мережа, сервер): не блокуємо застосунок онбордингом
      .catch(() => known.set(token, true))
      .finally(() => live && rerender())
    return () => {
      live = false
    }
  }, [token])
  return token ? known.get(token) : true
}
