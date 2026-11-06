// Акаунт для відображення (аватар-ініціали й підпис) з відповіді GET /auth/me.
import { useEffect, useState } from 'react'
import { get, getToken } from './api.js'

const INITIALS_WORDS = 2

/** Підпис і ініціали перших двох слів імені; без імені — пошта. */
export function accountOf({ name, email }) {
  const label = (name ?? '').trim() || email
  const initials = label.split(/\s+/).slice(0, INITIALS_WORDS).map((word) => word.charAt(0).toUpperCase()).join('')
  return { name: label, initials }
}

/** Поточний акаунт для відображення; null — гість, токен прострочений або сервер не відповів. */
export function useAccount() {
  const [account, setAccount] = useState(null)
  useEffect(() => {
    if (!getToken()) return
    let live = true
    get('/auth/me').then((user) => live && setAccount(accountOf(user)), () => {})
    return () => { live = false }
  }, [])
  return account
}
