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

test('an error keeps the status, the code and the whole body, so a screen can react to a plan limit', async () => {
  globalThis.fetch = reply(403, { statusCode: 403, code: 'PLAN_LIMIT', limit: 'readingsPerMonth', plan: 'free', message: 'You have used all 5 readings' })
  await rejects(get('/tarot/readings'), (e) => {
    strictEqual(e.message, 'You have used all 5 readings')
    strictEqual(e.status, 403)
    strictEqual(e.code, 'PLAN_LIMIT')
    strictEqual(e.data.limit, 'readingsPerMonth')
    return true
  })
})

test('an error without a code has an undefined code', async () => {
  globalThis.fetch = reply(500, { message: 'boom' })
  await rejects(get('/x'), (e) => e.code === undefined && e.status === 500)
})

test('the same GET within a few seconds is one request; a change in between, an error or another path is not shared', async () => {
  setToken('dedupe')
  let calls = 0
  globalThis.fetch = async () => (calls++, reply(200, { n: calls })())
  const [a, b] = await Promise.all([get('/settings'), get('/settings')])
  strictEqual(calls, 1, 'two screens asking at once share one request')
  a.n = 99
  strictEqual(b.n, 1, 'each caller gets its own copy')
  strictEqual((await get('/settings')).n, 1, 'still fresh a moment later')
  await get('/profile')
  strictEqual(calls, 2, 'another path is its own request')
  await post('/settings', {})
  await get('/settings')
  strictEqual(calls, 4, 'a change clears the reuse (post + a fresh get)')
  globalThis.fetch = reply(500, { message: 'boom' })
  await rejects(get('/broken'), { message: 'boom' })
  let retried = false
  globalThis.fetch = async () => ((retried = true), reply(200, {})())
  await get('/broken')
  strictEqual(retried, true, 'a failed GET is not remembered')
})
