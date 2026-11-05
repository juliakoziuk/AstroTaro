import { test } from 'node:test'
import { strictEqual, rejects, deepStrictEqual } from 'node:assert/strict'
import { login, register, signOut, getToken } from './auth.js'

const store = new Map()
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }

globalThis.document = { documentElement: {} }
const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => body })

test('login stores the token and returns the user', async () => {
  globalThis.fetch = async (url, init) => {
    strictEqual(url.endsWith('/auth/login'), true)
    deepStrictEqual(JSON.parse(init.body), { email: 'a@b.co', password: 'secret123' })
    return reply(201, { token: 't1', user: { name: 'Юля' } })()
  }
  const user = await login('a@b.co', 'secret123')
  strictEqual(user.name, 'Юля')
  strictEqual(getToken(), 't1')
})

test('register sends name, email, password', async () => {
  globalThis.fetch = async (_, init) => {
    deepStrictEqual(JSON.parse(init.body), { name: 'Юля', email: 'a@b.co', password: 'secret123' })
    return reply(201, { token: 't2', user: {} })()
  }
  await register('Юля', 'a@b.co', 'secret123')
  strictEqual(getToken(), 't2')
})

test('a server error surfaces its message and keeps the old token out', async () => {
  signOut()
  globalThis.fetch = reply(401, { message: 'Невірний email або пароль' })
  await rejects(login('a@b.co', 'x'), { message: 'Невірний email або пароль' })
  strictEqual(getToken(), null)
})

test('validation errors arrive as a list and are joined', async () => {
  globalThis.fetch = reply(400, { message: ['email must be an email', 'password too short'] })
  await rejects(login('x', 'y'), { message: 'email must be an email, password too short' })
})
