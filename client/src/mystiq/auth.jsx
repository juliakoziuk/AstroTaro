import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, setUnauthorizedHandler, tokenStore } from './api.js'
import { AuthContext } from './authCore.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Поки перевіряємо збережений токен, не знаємо — гість це чи ні
  const [checking, setChecking] = useState(() => !!tokenStore.get())

  const logout = useCallback(() => {
    tokenStore.set(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!tokenStore.get()) return
    api
      .get('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setChecking(false))
  }, [logout])

  const enter = useCallback(({ token, user }) => {
    tokenStore.set(token)
    setUser(user)
  }, [])

  const value = useMemo(
    () => ({
      user,
      checking,
      logout,
      login: async (email, password) => enter(await api.post('/auth/login', { email, password })),
      register: async (name, email, password) => enter(await api.post('/auth/register', { name, email, password })),
      setConsent: async (patch) => setUser(await api.patch('/auth/consent', patch)),
    }),
    [user, checking, logout, enter],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
