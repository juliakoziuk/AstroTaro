import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { forgetRecentGets } from '../lib/api.js'

// jsdom не має matchMedia: екрани питають про вузьке вікно (див. useMediaQuery). Тести — на «широкому» вікні.
globalThis.matchMedia ??= (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })

window.scrollTo = () => {} // jsdom не реалізує; екрани прокручують нагору при переході

beforeEach(() => {
  forgetRecentGets() // GET, однакові за шляхом, у сусідніх тестах не мають ділити відповідь
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState({}, '', '/')
  window.location.hash = ''
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Підміна fetch: routes — { 'GET /auth/me': [200, {...}] } або функція (init) => [status, body] (або проміс із ним); решта шляхів — 404. Повертає список викликів. */
export function mockApi(routes) {
  const calls = []
  vi.stubGlobal('fetch', async (url, init = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+\/api/, '')
    const key = `${init.method ?? 'GET'} ${path}`
    calls.push({ key, body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers })
    const hit = routes[key]
    const [status, body] = await (typeof hit === 'function' ? hit(init) : (hit ?? [404, { message: `no mock for ${key}` }]))
    return { ok: status < 400, status, json: async () => body }
  })
  return calls
}
