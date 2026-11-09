import { test } from 'node:test'
import { deepStrictEqual, rejects, strictEqual } from 'node:assert/strict'

const store = new Map()
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
globalThis.document = { documentElement: {} }
const { api, get, post, setToken, getToken, setUnauthorizedHandler } = await import('./api.js')
const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => body })

test('requests carry the token and the interface language', async () => {
  setToken('tok')
  let seen
  globalThis.fetch = async (url, init) => ((seen = { url, init }), reply(200, { ok: true })())
  await get('/dashboard')
  strictEqual(seen.init.headers.Authorization, 'Bearer tok')
  strictEqual(seen.init.headers['Accept-Language'], 'en')
  strictEqual(seen.url.endsWith('/dashboard'), true)
})

test('a request without a token sends no Authorization header', async () => {
  localStorage.removeItem('astrotarot.token')
  let headers
  globalThis.fetch = async (_, init) => ((headers = init.headers), reply(200, {})())
  await get('/plans')
  strictEqual('Authorization' in headers, false)
})

test('a body is sent as JSON', async () => {
  let init
  globalThis.fetch = async (_, i) => ((init = i), reply(201, {})())
  await post('/dreams', { title: 'x' })
  strictEqual(init.method, 'POST')
  deepStrictEqual(JSON.parse(init.body), { title: 'x' })
})

test('401 with a token signs out and calls the handler; 401 without a token (a failed login) does not', async () => {
  let called = 0
  setUnauthorizedHandler(() => called++)
  setToken('stale')
  globalThis.fetch = reply(401, { message: 'Unauthorized' })
  await rejects(get('/dreams'), { message: 'Unauthorized' })
  strictEqual(getToken(), null)
  strictEqual(called, 1)
  await rejects(api('POST', '/auth/login', {}), { message: 'Unauthorized' })
  strictEqual(called, 1, 'no token: the handler is not called, so a wrong password does not redirect')
})

test('other errors keep the token', async () => {
  setToken('tok')
  globalThis.fetch = reply(403, { message: 'Paid plans cannot be activated yet' })
  await rejects(get('/x'), { message: 'Paid plans cannot be activated yet' })
  strictEqual(getToken(), 'tok')
})

test('an unreachable server gives a readable error', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed')
  }
  await rejects(get('/x'), /зʼєднатися|з'єднатися/)
})

test('a response that is not JSON still produces a message', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 502, json: async () => { throw new SyntaxError('bad') } })
  await rejects(get('/x'), { message: 'Щось пішло не так' })
})
