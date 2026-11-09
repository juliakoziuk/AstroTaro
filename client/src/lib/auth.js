// Реєстрація й вхід: сервер повертає токен, ми його зберігаємо й віддаємо користувача.
import { post, setToken } from './api.js'

export { getToken, signOut } from './api.js'

async function authenticate(path, body, remember) {
  const { token, user } = await post(path, body)
  setToken(token, remember)
  return user
}

/** remember: true — довгий токен у localStorage; false — токен лише на час вкладки; не передано — як раніше (localStorage). */
export const login = (email, password, remember) =>
  authenticate('/auth/login', { email, password, ...(remember === undefined ? {} : { remember }) }, remember)
/** Лист із посиланням на скидання пароля (відповідь однакова, є така пошта чи ні). */
export const forgotPassword = (email) => post('/auth/forgot-password', { email })
export const resetPassword = (token, password) => post('/auth/reset-password', { token, password })
export const verifyEmail = (token) => post('/auth/verify-email', { token })
export const register = (name, email, password) => authenticate('/auth/register', { name, email, password })
