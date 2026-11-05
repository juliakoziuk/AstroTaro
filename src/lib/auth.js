// Реєстрація й вхід: сервер повертає токен, ми його зберігаємо й віддаємо користувача.
import { post, setToken } from './api.js'

export { getToken, signOut } from './api.js'

async function authenticate(path, body) {
  const { token, user } = await post(path, body)
  setToken(token)
  return user
}

export const login = (email, password) => authenticate('/auth/login', { email, password })
export const register = (name, email, password) => authenticate('/auth/register', { name, email, password })
