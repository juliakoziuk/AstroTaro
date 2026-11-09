// Наскрізні тести HTTP-шару проти справжнього застосунку й бази (npm run test:e2e): вхід, права доступу, чужі записи, тарифи, ліміти.
// Лімітер реєстрації в памʼяті (10 за годину з адреси), тож набір створює небагато користувачів, а тест ліміту йде останнім.
import { after, before, describe, test } from 'node:test'
import { createHmac } from 'node:crypto'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { Harness, startHarness } from './harness'

let h: Harness
before(async () => {
  h = await startHarness()
})
after(async () => {
  await h?.close()
})

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
/** JWT, підписаний HS256 заданим секретом (для підробок і прострочених токенів). */
const jwt = (payload: object, secret: string) => {
  const head = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`
  return `${head}.${createHmac('sha256', secret).update(head).digest('base64url')}`
}
const decode = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
const text = (v: unknown) => JSON.stringify(v)

// Маршрути, що вимагають входу: метод і шлях (без /api)
const PROTECTED: [string, string][] = [
  ['GET', '/auth/me'], ['PATCH', '/auth/consent'],
  ['GET', '/dashboard'], ['GET', '/profile'], ['PATCH', '/profile'], ['GET', '/settings'], ['PATCH', '/settings'], ['POST', '/settings/reset'], ['GET', '/profile/export'],
  ['POST', '/billing/plan'],
  ['GET', '/dreams'], ['POST', '/dreams'], ['GET', '/dreams/00000000-0000-4000-8000-000000000000'],
  ['GET', '/journal'], ['POST', '/journal'], ['GET', '/spreads'], ['POST', '/spreads'], ['POST', '/tarot/readings'],
  ['GET', '/messages'], ['POST', '/messages'], ['DELETE', '/messages'], ['POST', '/companion/chat'],
  ['GET', '/astrology'], ['GET', '/astrology/forecast'], ['GET', '/astrology/reports'], ['POST', '/astrology/reports'], ['POST', '/astrology/compatibility'],
  ['GET', '/cosmos/geo'], ['GET', '/cosmos/apod'], ['GET', '/cosmos/quote'], ['GET', '/cosmos/sun'], ['GET', '/cosmos/holidays'], ['GET', '/cosmos/art'],
]

describe('public routes', () => {
  test('plans, spreads, decks, cards and personas need no token', async () => {
    for (const path of ['/plans', '/tarot/spreads', '/tarot/decks', '/tarot/cards', '/companion/personas']) {
      const r = await h.api('GET', path)
      strictEqual(r.status, 200, path)
    }
    strictEqual((await h.api('GET', '/tarot/cards')).body.length, 78)
  })

  test('security headers are set and the framework is not advertised', async () => {
    const r = await h.api('GET', '/plans')
    strictEqual(r.headers.get('x-content-type-options'), 'nosniff')
    strictEqual(r.headers.get('x-powered-by'), null)
  })

  test('the API docs page is served', async () => {
    const res = await fetch(`http://127.0.0.1:${(h.app.getHttpServer().address() as { port: number }).port}/api/docs`)
    strictEqual(res.status, 200)
  })
})

describe('access control: every protected route rejects a missing or bad token', () => {
  test('no token', async () => {
    for (const [method, path] of PROTECTED) strictEqual((await h.api(method, path)).status, 401, `${method} ${path}`)
  })

  test('garbage, forged, expired and unsigned tokens', async () => {
    const secret = process.env.JWT_SECRET
    ok(secret, 'JWT_SECRET is configured')
    const sub = '00000000-0000-4000-8000-000000000001'
    const now = Math.floor(Date.now() / 1000)
    const tokens = {
      garbage: 'not-a-token',
      'signed with another secret': jwt({ sub, email: 'x@y.z', exp: now + 3600 }, `${secret}-other`),
      expired: jwt({ sub, email: 'x@y.z', exp: now - 10 }, secret),
      'alg none': `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub, email: 'x@y.z', exp: now + 3600 })}.`,
    }
    for (const [name, token] of Object.entries(tokens)) {
      for (const path of ['/auth/me', '/dreams', '/profile']) strictEqual((await h.api('GET', path, { token })).status, 401, `${name} on ${path}`)
    }
  })

  test('a correctly signed token for a user that does not exist is rejected by /auth/me', async () => {
    const token = jwt({ sub: '00000000-0000-4000-8000-000000000002', email: 'ghost@example.com', exp: Math.floor(Date.now() / 1000) + 3600 }, process.env.JWT_SECRET)
    strictEqual((await h.api('GET', '/auth/me', { token })).status, 401)
  })
})

describe('registration and sign-in', () => {
  test('register returns a token and a public user, never the password hash', async () => {
    const email = `e2e-reg-${Date.now()}@example.com`
    const r = await h.api('POST', '/auth/register', { body: { name: ' Юля ', email: email.toUpperCase(), password: 'correct horse battery' } })
    strictEqual(r.status, 201)
    ok(r.body.token)
    strictEqual(r.body.user.email, email, 'the email is stored lower-cased')
    strictEqual(r.body.user.name, 'Юля', 'the name is trimmed')
    deepStrictEqual(r.body.user.consent, { dreams: false, journal: false, spreads: false }, 'nothing is shared with the AI by default')
    ok(!/passwordHash|password"/.test(text(r.body)), 'no password data in the response')
    // той самий email іншим регістром — уже зайнятий
    const again = await h.api('POST', '/auth/register', { body: { name: 'Other', email, password: 'correct horse battery' } })
    strictEqual(again.status, 409)
  })

  test('bad registration input is rejected with messages in the request language', async () => {
    strictEqual((await h.api('POST', '/auth/register', { body: { name: 'A', email: 'not-an-email', password: 'correct horse battery' } })).status, 400)
    const short = await h.api('POST', '/auth/register', { body: { name: 'A', email: 'a@b.co', password: 'short' }, lang: 'uk' })
    strictEqual(short.status, 400)
    ok(/символів/.test(text(short.body)), text(short.body))
    const extra = await h.api('POST', '/auth/register', { body: { name: 'A', email: 'a@b.co', password: 'correct horse battery', plan: 'premium' } })
    strictEqual(extra.status, 400, 'unknown fields (like plan) are refused, not ignored')
  })

  test('login: same answer for a wrong password and an unknown email; remember-me lives longer', async () => {
    const u = await h.register()
    const ok1 = await h.api('POST', '/auth/login', { body: { email: u.email, password: u.password } })
    strictEqual(ok1.status, 201)
    strictEqual(ok1.body.user.id, u.id)
    const wrong = await h.api('POST', '/auth/login', { body: { email: u.email, password: 'wrong password here' } })
    const unknown = await h.api('POST', '/auth/login', { body: { email: 'nobody-here@example.com', password: 'wrong password here' } })
    strictEqual(wrong.status, 401)
    strictEqual(unknown.status, 401)
    deepStrictEqual(wrong.body, unknown.body, 'the error does not reveal whether the email exists')
    const long = await h.api('POST', '/auth/login', { body: { email: u.email, password: u.password, remember: true } })
    const span = (t: string) => decode(t).exp - decode(t).iat
    ok(span(long.body.token) > span(ok1.body.token), 'remember-me token has a longer lifetime')
    const me = await h.api('GET', '/auth/me', { token: ok1.body.token })
    strictEqual(me.status, 200)
    ok(!/passwordHash/.test(text(me.body)))
  })
})

describe('records belong to their owner', () => {
  let a: Awaited<ReturnType<Harness['register']>>
  let c: Awaited<ReturnType<Harness['register']>>
  const ids: Record<string, string> = {}
  before(async () => {
    a = await h.register('Anna')
    c = await h.register('Boris')
  })

  const create = {
    dreams: { title: 'Flying', text: 'I was flying over the sea and found a door' },
    journal: { mood: 4, text: 'a calm day' },
    spreads: { spreadId: 'three', cards: [{ id: 0, reversed: false }, { id: 1, reversed: true }, { id: 2, reversed: false }], question: 'private question' },
  } as const

  for (const kind of ['dreams', 'journal', 'spreads'] as const) {
    test(`${kind}: the owner creates and reads, another user sees nothing and cannot touch it`, async () => {
      const made = await h.api('POST', `/${kind}`, { token: a.token, body: create[kind] })
      strictEqual(made.status, 201, text(made.body))
      ids[kind] = made.body.id
      strictEqual((await h.api('GET', `/${kind}/${ids[kind]}`, { token: a.token })).status, 200)

      const listB = await h.api('GET', `/${kind}`, { token: c.token })
      strictEqual(listB.status, 200)
      ok(!text(listB.body).includes(ids[kind]), 'the other user list does not include it')
      strictEqual((await h.api('GET', `/${kind}/${ids[kind]}`, { token: c.token })).status, 404)
      const patch = kind === 'spreads' ? { saved: true } : kind === 'journal' ? { text: 'hijacked' } : { title: 'hijacked' }
      strictEqual((await h.api('PATCH', `/${kind}/${ids[kind]}`, { token: c.token, body: patch })).status, 404)
      strictEqual((await h.api('DELETE', `/${kind}/${ids[kind]}`, { token: c.token })).status, 404)

      const still = await h.api('GET', `/${kind}/${ids[kind]}`, { token: a.token })
      strictEqual(still.status, 200, 'the record survived the other user attempts')
      ok(!text(still.body).includes('hijacked'))
    })

    test(`${kind}: the id must be a UUID, and the owner can be set only by the server`, async () => {
      strictEqual((await h.api('GET', `/${kind}/1`, { token: a.token })).status, 400)
      const spoof = await h.api('POST', `/${kind}`, { token: c.token, body: { ...create[kind], userId: a.id } })
      strictEqual(spoof.status, 400, 'a userId in the body is refused')
    })
  }

  test('the owner can still change and delete the record', async () => {
    const upd = await h.api('PATCH', `/dreams/${ids.dreams}`, { token: a.token, body: { title: 'Flying again' } })
    strictEqual(upd.status, 200)
    strictEqual(upd.body.title, 'Flying again')
    strictEqual((await h.api('DELETE', `/journal/${ids.journal}`, { token: a.token })).status, 204)
    strictEqual((await h.api('GET', `/journal/${ids.journal}`, { token: a.token })).status, 404)
  })

  test('chat history is private, and clearing it clears only your own', async () => {
    await h.api('POST', '/messages', { token: a.token, body: { role: 'user', text: 'secret from Anna' } })
    await h.api('POST', '/messages', { token: c.token, body: { role: 'user', text: 'hello from Boris' } })
    const listB = (await h.api('GET', '/messages', { token: c.token })).body
    ok(!text(listB).includes('Anna'))
    strictEqual((await h.api('DELETE', '/messages', { token: c.token })).status, 204)
    strictEqual((await h.api('GET', '/messages', { token: c.token })).body.length, 0)
    ok(text((await h.api('GET', '/messages', { token: a.token })).body).includes('secret from Anna'), 'the other history is untouched')
  })

  test('the data export holds only your own records and no credentials', async () => {
    const mine = await h.api('GET', '/profile/export', { token: a.token })
    strictEqual(mine.status, 200)
    ok(text(mine.body).includes(ids.dreams))
    const theirs = await h.api('GET', '/profile/export', { token: c.token })
    ok(!text(theirs.body).includes(ids.dreams) && !text(theirs.body).includes(ids.spreads), 'the other export has none of these records')
    for (const body of [mine.body, theirs.body]) ok(!/passwordHash|\$2[aby]\$|"token"/.test(text(body)), 'no hash or token in the export')
  })

  test('the dashboard counts only your own records', async () => {
    const d = await h.api('GET', '/dashboard', { token: c.token })
    strictEqual(d.status, 200)
    strictEqual(d.body.counts.dreams, 0)
    strictEqual(d.body.counts.readings, 0)
    ok((await h.api('GET', '/dashboard', { token: a.token })).body.counts.dreams >= 1)
  })
})

describe('plans and consent', () => {
  let u: Awaited<ReturnType<Harness['register']>>
  before(async () => {
    u = await h.register()
  })

  test('a paid plan cannot be switched on without payment, the free one can', async () => {
    const pro = await h.api('POST', '/billing/plan', { token: u.token, body: { plan: 'premium' } })
    strictEqual(pro.status, 403)
    const uk = await h.api('POST', '/billing/plan', { token: u.token, body: { plan: 'premium' }, lang: 'uk' })
    ok(/тариф/i.test(text(uk.body)))
    strictEqual((await h.api('GET', '/profile', { token: u.token })).body.plan, 'free')
    strictEqual((await h.api('POST', '/billing/plan', { token: u.token, body: { plan: 'free' } })).status, 201)
    strictEqual((await h.api('POST', '/billing/plan', { token: u.token, body: { plan: 'gold' } })).status, 400)
  })

  test('the plan cannot be changed through the profile or settings endpoints', async () => {
    strictEqual((await h.api('PATCH', '/profile', { token: u.token, body: { plan: 'premium' } })).status, 400)
    strictEqual((await h.api('PATCH', '/settings', { token: u.token, body: { plan: 'premium' } })).status, 400)
    strictEqual((await h.api('GET', '/profile', { token: u.token })).body.plan, 'free')
  })

  test('parallel consent and settings updates do not undo each other', async () => {
    await Promise.all(Array.from({ length: 10 }, () => ['dreams', 'journal', 'spreads'].map((k) => h.api('PATCH', '/auth/consent', { token: u.token, body: { [k]: true } }))).flat())
    deepStrictEqual((await h.api('GET', '/auth/me', { token: u.token })).body.consent, { dreams: true, journal: true, spreads: true })
    await Promise.all([h.api('PATCH', '/auth/consent', { token: u.token, body: { dreams: false } }), ...Array.from({ length: 10 }, (_, i) => h.api('PATCH', '/auth/consent', { token: u.token, body: { journal: i % 2 === 0 } }))])
    strictEqual((await h.api('GET', '/auth/me', { token: u.token })).body.consent.dreams, false, 'a revoked consent stays revoked')
    await Promise.all([h.api('PATCH', '/settings', { token: u.token, body: { theme: 'Light' } }), h.api('PATCH', '/settings', { token: u.token, body: { language: 'Ukrainian' } })])
    const s = (await h.api('GET', '/settings', { token: u.token })).body
    strictEqual(s.theme, 'Light')
    strictEqual(s.language, 'Ukrainian')
    strictEqual((await h.api('PATCH', '/settings', { token: u.token, body: { theme: 'Neon' } })).status, 400)
  })
})

describe('tarot and companion flows', () => {
  let u: Awaited<ReturnType<Harness['register']>>
  before(async () => {
    u = await h.register()
  })

  test('a reading is saved to the history, and with autosave off it is only temporary', async () => {
    const draw = { spreadId: 'three', deck: 'Classic Tarot', mode: 'quick', question: 'Will it work out?' }
    const saved = await h.api('POST', '/tarot/readings', { token: u.token, body: draw })
    strictEqual(saved.status, 201, text(saved.body))
    strictEqual(saved.body.cards.length, 3)
    strictEqual(saved.body.temporary, false)
    strictEqual((await h.api('GET', '/spreads', { token: u.token })).body.length, 1)

    await h.api('PATCH', '/settings', { token: u.token, body: { autosave: false } })
    const temp = await h.api('POST', '/tarot/readings', { token: u.token, body: draw })
    strictEqual(temp.status, 201)
    strictEqual(temp.body.temporary, true)
    strictEqual((await h.api('GET', '/spreads', { token: u.token })).body.length, 1, 'the temporary reading is not stored')

    strictEqual((await h.api('POST', '/tarot/readings', { token: u.token, body: { ...draw, spreadId: 'nope' } })).status, 400)
    strictEqual((await h.api('POST', '/tarot/readings', { token: u.token, body: { ...draw, cards: [{ id: 5, reversed: false }, { id: 5, reversed: false }, { id: 6, reversed: false }] } })).status, 400, 'duplicate cards are refused')
  })

  test('the companion answers locally without a model, and respects the off switch', async () => {
    const chat = await h.api('POST', '/companion/chat', { token: u.token, body: { persona: 'Mystic Guide', text: 'What does this week hold?' } })
    strictEqual(chat.status, 201, text(chat.body))
    strictEqual(chat.body.source, 'local')
    ok(chat.body.reply.text.length > 0)
    await h.api('PATCH', '/settings', { token: u.token, body: { companion: false } })
    strictEqual((await h.api('POST', '/companion/chat', { token: u.token, body: { persona: 'Mystic Guide', text: 'Hello?' } })).status, 403)
  })
})

describe('brute force protection (runs last: it uses up the address limits)', () => {
  test('after 8 wrong passwords even the right one is refused with 429, in the request language', async () => {
    const u = await h.register()
    for (let i = 0; i < 8; i++) strictEqual((await h.api('POST', '/auth/login', { body: { email: u.email, password: 'wrong password here' } })).status, 401)
    const locked = await h.api('POST', '/auth/login', { body: { email: u.email, password: u.password } })
    strictEqual(locked.status, 429)
    ok(/Too many attempts/.test(text(locked.body)))
    ok(/Забагато спроб/.test(text((await h.api('POST', '/auth/login', { body: { email: u.email, password: u.password }, lang: 'uk' })).body)))
    // інший акаунт з тієї ж адреси не заблокований
    const other = await h.register()
    strictEqual((await h.api('POST', '/auth/login', { body: { email: other.email, password: other.password } })).status, 201)
  })

  test('one address cannot register an unlimited number of accounts', async () => {
    let blocked = 0
    for (let i = 0; i < 12 && !blocked; i++) {
      const r = await h.api('POST', '/auth/register', { body: { name: 'Bulk', email: `e2e-bulk-${Date.now()}-${i}@example.com`, password: 'correct horse battery' } })
      if (r.status === 429) blocked = i + 1
      else strictEqual(r.status, 201)
    }
    ok(blocked > 0, 'a 429 appeared before 12 registrations')
  })
})
