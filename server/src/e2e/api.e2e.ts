// Наскрізні тести HTTP-шару проти справжнього застосунку й бази (npm run test:e2e): вхід, права доступу, чужі записи, тарифи, ліміти.
// Лімітери в памʼяті діють на всю адресу (10 реєстрацій за годину), тож перед блоком про ліміти їх обнуляємо.
import { after, before, describe, test } from 'node:test'
import { createHmac } from 'node:crypto'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { signStripePayload, STRIPE_LOCALES } from '../billing/stripe'
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
  ['GET', '/astrology'], ['GET', '/astrology/forecast'], ['GET', '/astrology/reports'], ['POST', '/astrology/reports'], ['POST', '/astrology/compatibility'],
  ['GET', '/cosmos/geo'], ['GET', '/cosmos/apod'], ['GET', '/cosmos/quote'], ['GET', '/cosmos/sun'], ['GET', '/cosmos/holidays'], ['GET', '/cosmos/art'],
]

describe('public routes', () => {
  test('plans, spreads, decks and cards need no token', async () => {
    for (const path of ['/plans', '/tarot/spreads', '/tarot/decks', '/tarot/cards']) {
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

describe('search, tags and paging of dreams and the journal', () => {
  let u: Awaited<ReturnType<Harness['register']>>
  let other: Awaited<ReturnType<Harness['register']>>
  const dream = (title: string, text: string, extra: object = {}) => h.api('POST', '/dreams', { token: u.token, body: { title, text, ...extra } })
  const titles = (r: { body: { title: string }[] }) => r.body.map((d) => d.title).sort()
  before(async () => {
    u = await h.register()
    other = await h.register()
    await dream('Whale', 'A huge whale in the ocean', { mood: 'calm', symbols: ['whale', 'sea'], date: '2026-03-10T10:00:00.000Z' })
    await dream('Stairs', 'Climbing a long staircase, 100% sure it was real', { mood: 'anxious', symbols: ['stairs'], date: '2026-04-15T10:00:00.000Z' })
    await dream('Door', 'A door_in a dark room', { mood: 'calm', symbols: ['sea'], date: '2026-05-20T10:00:00.000Z' })
    await h.api('POST', '/dreams', { token: other.token, body: { title: 'Whale of someone else', text: 'ocean', symbols: ['sea'] } })
  })

  test('dreams: text search ignores case, looks in title and text, and never returns other people records', async () => {
    deepStrictEqual(titles(await h.api('GET', '/dreams?q=WHALE', { token: u.token })), ['Whale'])
    deepStrictEqual(titles(await h.api('GET', '/dreams?q=staircase', { token: u.token })), ['Stairs'], 'matches the text, not only the title')
    deepStrictEqual(titles(await h.api('GET', '/dreams?q=nothing-like-this', { token: u.token })), [])
  })

  test('dreams: % and _ in the search are letters, not wildcards', async () => {
    deepStrictEqual(titles(await h.api('GET', '/dreams?q=' + encodeURIComponent('100%'), { token: u.token })), ['Stairs'])
    deepStrictEqual(titles(await h.api('GET', '/dreams?q=' + encodeURIComponent('door_in'), { token: u.token })), ['Door'])
    deepStrictEqual(titles(await h.api('GET', '/dreams?q=' + encodeURIComponent('%'), { token: u.token })), ['Stairs'], 'a bare % matches only text that contains it')
    deepStrictEqual(titles(await h.api('GET', '/dreams?q=' + encodeURIComponent('d_or'), { token: u.token })), [], '_ does not stand for any letter')
  })

  test('dreams: filter by tag, mood and period, and the filters combine', async () => {
    deepStrictEqual(titles(await h.api('GET', '/dreams?tag=sea', { token: u.token })), ['Door', 'Whale'])
    deepStrictEqual(titles(await h.api('GET', '/dreams?tag=SEA', { token: u.token })), ['Door', 'Whale'], 'tags are case-insensitive')
    deepStrictEqual(titles(await h.api('GET', '/dreams?mood=calm', { token: u.token })), ['Door', 'Whale'])
    deepStrictEqual(titles(await h.api('GET', '/dreams?from=2026-04-01&to=2026-04-30', { token: u.token })), ['Stairs'])
    deepStrictEqual(titles(await h.api('GET', '/dreams?to=2026-04-15', { token: u.token })), ['Stairs', 'Whale'], 'the end date includes the whole day')
    deepStrictEqual(titles(await h.api('GET', '/dreams?tag=sea&mood=calm&q=door', { token: u.token })), ['Door'])
  })

  test('dreams: tag list with counts, and paging with the total in a header', async () => {
    const tags = await h.api('GET', '/dreams/tags', { token: u.token })
    strictEqual(tags.status, 200)
    deepStrictEqual(tags.body[0], { tag: 'sea', count: 2 }, 'the most common tag comes first')
    ok(!text(tags.body).includes('someone'), 'only own dreams are counted')
    const page = await h.api('GET', '/dreams?limit=2&offset=1', { token: u.token })
    strictEqual(page.body.length, 2)
    strictEqual(page.headers.get('x-total-count'), '3')
    deepStrictEqual(page.body.map((d: { title: string }) => d.title), ['Stairs', 'Whale'], 'newest first: Door, Stairs, Whale; the page skips the first')
  })

  test('dreams: bad query values are refused', async () => {
    for (const q of ['limit=0', 'limit=501', 'offset=-1', 'limit=abc', 'from=yesterday', 'unknown=1']) strictEqual((await h.api('GET', '/dreams?' + q, { token: u.token })).status, 400, q)
  })

  test('journal: tags are normalized, searchable and filterable, with counts', async () => {
    const make = (text: string, mood: number, tags: string[], date: string) => h.api('POST', '/journal', { token: u.token, body: { text, mood, tags, date } })
    const first = await make('Long walk by the river', 5, [' Walk ', 'WALK', 'river', ''], '2026-02-01T08:00:00.000Z')
    strictEqual(first.status, 201, text(first.body))
    deepStrictEqual(first.body.tags, ['walk', 'river'], 'trimmed, lower-cased, no duplicates or empty tags')
    await make('Hard day at work', 2, ['work'], '2026-02-02T08:00:00.000Z')
    await make('Quiet evening, a walk again', 4, ['walk'], '2026-02-03T08:00:00.000Z')
    await h.api('POST', '/journal', { token: other.token, body: { text: 'walk walk walk', mood: 3, tags: ['walk'] } })

    const j = async (query: string) => (await h.api('GET', '/journal?' + query, { token: u.token })).body.map((e: { text: string }) => e.text.split(' ')[0])
    deepStrictEqual(await j('q=WALK'), ['Quiet', 'Long'], 'searches the text, newest first')
    deepStrictEqual(await j('tag=walk'), ['Quiet', 'Long'])
    deepStrictEqual(await j('tag=walk&mood=5'), ['Long'])
    deepStrictEqual(await j('mood=2'), ['Hard'])
    deepStrictEqual(await j('from=2026-02-02&to=2026-02-02'), ['Hard'])
    deepStrictEqual(await j('q=walk&limit=1&offset=1'), ['Long'])
    strictEqual((await h.api('GET', '/journal?tag=walk', { token: u.token })).headers.get('x-total-count'), '2')
    deepStrictEqual((await h.api('GET', '/journal/tags', { token: u.token })).body, [{ tag: 'walk', count: 2 }, { tag: 'river', count: 1 }, { tag: 'work', count: 1 }])
    strictEqual((await h.api('GET', '/journal?mood=9', { token: u.token })).status, 400)
  })

  test('journal: the tags of an entry can be changed, and tag routes need a token', async () => {
    const entry = (await h.api('GET', '/journal?q=Hard', { token: u.token })).body[0]
    const upd = await h.api('PATCH', '/journal/' + entry.id, { token: u.token, body: { tags: ['Stress', 'work'] } })
    strictEqual(upd.status, 200)
    deepStrictEqual(upd.body.tags, ['stress', 'work'])
    strictEqual((await h.api('GET', '/journal/tags')).status, 401)
    strictEqual((await h.api('GET', '/dreams/tags')).status, 401)
  })
})

describe('sharing a reading by a public link', () => {
  let owner: Awaited<ReturnType<Harness['register']>>
  let stranger: Awaited<ReturnType<Harness['register']>>
  let spreadId: string
  let link: { token: string; path: string; url: string }
  before(async () => {
    h.resetLimits()
    owner = await h.register('Marta')
    stranger = await h.register('Stranger')
    const r = await h.api('POST', '/spreads', { token: owner.token, body: { spreadId: 'three', question: 'Should I move to a new city?', cards: [{ id: 0, reversed: false }, { id: 1, reversed: true }, { id: 2, reversed: false }] } })
    spreadId = r.body.id
  })

  test('before sharing nothing is public, and only the owner can create a link', async () => {
    strictEqual((await h.api('GET', '/shared/' + 'z'.repeat(43))).status, 404)
    strictEqual((await h.api('POST', '/spreads/' + spreadId + '/share')).status, 401)
    strictEqual((await h.api('POST', '/spreads/' + spreadId + '/share', { token: stranger.token })).status, 404, 'a stranger cannot share your reading')
    strictEqual((await h.api('GET', '/spreads/' + spreadId, { token: owner.token })).body.shareToken ?? null, null)
  })

  test('the owner gets a link; asking again returns the same one', async () => {
    const first = await h.api('POST', '/spreads/' + spreadId + '/share', { token: owner.token })
    strictEqual(first.status, 201, text(first.body))
    link = first.body
    ok(link.token.length >= 40, 'a long random token')
    ok(link.url.includes('/app.html#/shared?token=' + link.token), link.url)
    strictEqual(link.path, '/shared?token=' + link.token)
    deepStrictEqual((await h.api('POST', '/spreads/' + spreadId + '/share', { token: owner.token })).body, link)
  })

  test('anyone with the link sees the reading without signing in, but no account data', async () => {
    const r = await h.api('GET', '/shared/' + link.token)
    strictEqual(r.status, 200)
    strictEqual(r.body.question, 'Should I move to a new city?')
    strictEqual(r.body.cards.length, 3)
    ok(r.body.result && r.body.result.source, 'the interpretation is included')
    const raw = text(r.body)
    ok(!raw.includes(owner.id) && !raw.includes(owner.email) && !raw.includes('Marta'), 'no account data')
    ok(!raw.includes(spreadId) && !raw.includes(link.token), 'no internal id and no token in the body')
    strictEqual(r.headers.get('x-robots-tag'), 'noindex, nofollow')
    strictEqual(r.headers.get('cache-control'), 'no-store')
    const uk = await h.api('GET', '/shared/' + link.token, { lang: 'uk' })
    ok(/[А-Яа-яІіЇїЄє]/.test(text(uk.body.result)), 'the interpretation follows the request language')
  })

  test('the link opens one reading only, and other readings of the owner stay private', async () => {
    const other = await h.api('POST', '/spreads', { token: owner.token, body: { spreadId: 'one', question: 'secret', cards: [{ id: 7, reversed: false }] } })
    const r = await h.api('GET', '/shared/' + link.token)
    ok(!text(r.body).includes('secret'))
    strictEqual((await h.api('GET', '/shared/' + other.body.id)).status, 404, 'a reading id is not a link')
  })

  test('revoking stops the link at once; sharing again makes a new link', async () => {
    strictEqual((await h.api('DELETE', '/spreads/' + spreadId + '/share', { token: stranger.token })).status, 404, 'a stranger cannot revoke it')
    strictEqual((await h.api('GET', '/shared/' + link.token)).status, 200)
    strictEqual((await h.api('DELETE', '/spreads/' + spreadId + '/share', { token: owner.token })).status, 204)
    strictEqual((await h.api('GET', '/shared/' + link.token)).status, 404)
    const again = await h.api('POST', '/spreads/' + spreadId + '/share', { token: owner.token })
    ok(again.body.token !== link.token, 'the old link stays dead')
    strictEqual((await h.api('GET', '/shared/' + link.token)).status, 404)
    strictEqual((await h.api('GET', '/shared/' + again.body.token)).status, 200)
    link = again.body
  })

  test('deleting the reading deletes its link', async () => {
    strictEqual((await h.api('DELETE', '/spreads/' + spreadId, { token: owner.token })).status, 204)
    strictEqual((await h.api('GET', '/shared/' + link.token)).status, 404)
  })

  test('the public route is rate limited per address (runs last in this group)', async () => {
    let blocked = 0
    for (let i = 0; i < 70 && !blocked; i++) {
      const r = await h.api('GET', '/shared/' + String(i).padStart(43, 'q'))
      if (r.status === 429) blocked = i + 1
      else strictEqual(r.status, 404)
    }
    ok(blocked > 0 && blocked <= 61, 'a 429 appeared within 61 requests, got ' + blocked)
  })
})

describe('paid plans through Stripe', () => {
  const SECRET = 'whsec_test_secret'
  const PRICES = { pro: 'price_pro_1', premium: 'price_premium_1' }
  type Seen = { path: string; auth: string | undefined; idem: string | undefined; form: URLSearchParams }
  let seen: Seen[] = []
  let failNext = false
  let fake: Server
  let u: Awaited<ReturnType<Harness['register']>>
  let v: Awaited<ReturnType<Harness['register']>>
  const keep: Record<string, string | undefined> = {}
  const ENV = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_PREMIUM', 'STRIPE_API_BASE']

  /** Вебхук так, як його шле Stripe: сире тіло й підпис у заголовку. */
  const hook = async (event: object, opts: { signature?: string | null; secret?: string; timestamp?: number; tamper?: boolean } = {}) => {
    const body = JSON.stringify(event)
    const signature = opts.signature === undefined ? signStripePayload(body, opts.secret ?? SECRET, opts.timestamp) : opts.signature
    const res = await fetch(h.baseUrl + '/billing/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(signature ? { 'Stripe-Signature': signature } : {}) },
      body: opts.tamper ? body.replace('pro', 'premium') : body,
    })
    return res.status
  }
  const completed = (userId: string, extra: object = {}, metadata: object = { plan: 'pro' }) => ({
    type: 'checkout.session.completed',
    data: { object: { mode: 'subscription', payment_status: 'paid', client_reference_id: userId, customer: 'cus_123', subscription: 'sub_123', metadata, ...extra } },
  })
  const planOf = async (user: { token: string }) => (await h.api('GET', '/profile', { token: user.token })).body.plan

  before(async () => {
    h.resetLimits()
    for (const k of ENV) keep[k] = process.env[k]
    // підроблений Stripe: запам'ятовує запити й відповідає як справжній
    fake = createServer((req, res) => {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        const form = new URLSearchParams(body)
        seen.push({ path: req.url ?? '', auth: req.headers.authorization, idem: req.headers['idempotency-key'] as string | undefined, form })
        res.setHeader('Content-Type', 'application/json')
        // як справжній Stripe: невідома мова — 400 (саме так українська «uk» ламала оплату)
        if (form.has('locale') && !STRIPE_LOCALES.includes(form.get('locale')!)) {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: { message: 'Invalid locale: must be one of ' + STRIPE_LOCALES.join(', ') } }))
        }
        if (failNext) {
          failNext = false
          res.statusCode = 402
          return res.end(JSON.stringify({ error: { message: 'Your card was declined' } }))
        }
        res.end(JSON.stringify({ url: req.url?.includes('portal') ? 'https://billing.stripe.test/p/session' : 'https://checkout.stripe.test/c/pay/cs_test_1' }))
      })
    })
    await new Promise<void>((r) => fake.listen(0, '127.0.0.1', r))
    u = await h.register('Payer')
    v = await h.register('Other payer')
  })
  after(async () => {
    for (const k of ENV) {
      if (keep[k] === undefined) delete process.env[k]
      else process.env[k] = keep[k]
    }
    await new Promise((r) => fake?.close(r))
  })
  const configure = () => {
    Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_test_123', STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_PRO: PRICES.pro, STRIPE_PRICE_PREMIUM: PRICES.premium, STRIPE_API_BASE: 'http://127.0.0.1:' + (fake.address() as AddressInfo).port })
  }

  test('without Stripe configured a paid plan cannot be bought, and the endpoint needs a token and a known plan', async () => {
    for (const k of ENV) delete process.env[k]
    strictEqual((await h.api('POST', '/billing/checkout', { body: { plan: 'pro' } })).status, 401)
    strictEqual((await h.api('POST', '/billing/checkout', { token: u.token, body: { plan: 'pro' } })).status, 403)
    strictEqual((await h.api('POST', '/billing/checkout', { token: u.token, body: { plan: 'free' } })).status, 400, 'free needs no payment')
    strictEqual((await h.api('POST', '/billing/checkout', { token: u.token, body: { plan: 'pro', userId: v.id } })).status, 400)
    strictEqual((await h.api('POST', '/billing/portal', { token: u.token })).status, 400, 'nothing to manage yet')
    strictEqual(await hook(completed(u.id)), 400, 'a webhook cannot be accepted without a configured secret')
    strictEqual(await planOf(u), 'free')
  })

  test('checkout creates a Stripe subscription session for this user and does not grant the plan by itself', async () => {
    configure()
    seen = []
    const r = await h.api('POST', '/billing/checkout', { token: u.token, body: { plan: 'pro' }, lang: 'uk' })
    strictEqual(r.status, 201, text(r.body))
    strictEqual(r.body.url, 'https://checkout.stripe.test/c/pay/cs_test_1')
    strictEqual(seen.length, 1)
    strictEqual(seen[0].path, '/v1/checkout/sessions')
    strictEqual(seen[0].auth, 'Bearer sk_test_123')
    const f = seen[0].form
    strictEqual(f.get('mode'), 'subscription')
    strictEqual(f.get('line_items[0][price]'), PRICES.pro, 'the price comes from the server, never from the client')
    strictEqual(f.get('line_items[0][quantity]'), '1')
    strictEqual(f.get('client_reference_id'), u.id)
    strictEqual(f.get('customer_email'), u.email)
    strictEqual(f.get('metadata[plan]'), 'pro')
    strictEqual(f.get('subscription_data[metadata][userId]'), u.id)
    strictEqual(f.get('locale'), 'auto', 'Stripe has no Ukrainian: a Ukrainian interface still reaches the payment page')
    ok(f.get('success_url')?.includes('#/pricing?checkout=success'))
    strictEqual(await planOf(u), 'free', 'paying is confirmed by the webhook, not by this answer')
  })

  test('a Stripe failure becomes a 502 and leaves the plan alone', async () => {
    failNext = true
    strictEqual((await h.api('POST', '/billing/checkout', { token: u.token, body: { plan: 'premium' } })).status, 502)
    strictEqual(await planOf(u), 'free')
  })

  test('the webhook refuses a missing, wrong, tampered or stale signature', async () => {
    const event = completed(u.id)
    strictEqual(await hook(event, { signature: null }), 400, 'no signature')
    strictEqual(await hook(event, { signature: 'garbage' }), 400)
    strictEqual(await hook(event, { secret: 'whsec_someone_else' }), 400, 'signed with another secret')
    strictEqual(await hook(event, { tamper: true }), 400, 'the body was changed after signing')
    strictEqual(await hook(event, { timestamp: Math.floor(Date.now() / 1000) - 3600 }), 400, 'a replayed old request')
    strictEqual(await planOf(u), 'free')
  })

  test('a signed payment event turns the plan on, once or many times', async () => {
    strictEqual(await hook(completed(u.id)), 200)
    strictEqual(await planOf(u), 'pro')
    strictEqual(await hook(completed(u.id)), 200, 'Stripe repeats events')
    strictEqual(await planOf(u), 'pro')
  })

  test('events that are not a paid subscription for a known user change nothing', async () => {
    strictEqual(await hook(completed(v.id, { payment_status: 'unpaid' })), 200)
    strictEqual(await hook(completed(v.id, { mode: 'payment' })), 200)
    strictEqual(await hook(completed(v.id, {}, { plan: 'free' })), 200, 'free is not a paid plan')
    strictEqual(await hook(completed(v.id, {}, { plan: 'gold' })), 200)
    strictEqual(await hook(completed('not-a-uuid')), 200)
    strictEqual(await hook(completed('00000000-0000-4000-8000-000000000009')), 200, 'an unknown user does not make Stripe retry forever')
    strictEqual(await hook({ type: 'invoice.paid', data: { object: {} } }), 200, 'an event we do not use')
    strictEqual(await planOf(v), 'free')
  })

  test('with an active subscription: no second checkout, no plan change outside the portal, and the portal opens', async () => {
    strictEqual((await h.api('POST', '/billing/checkout', { token: u.token, body: { plan: 'premium' } })).status, 409)
    const free = await h.api('POST', '/billing/plan', { token: u.token, body: { plan: 'free' }, lang: 'uk' })
    strictEqual(free.status, 403)
    ok(/порталі/.test(text(free.body)))
    strictEqual(await planOf(u), 'pro', 'downgrading by a plain request would leave the person still being charged')
    seen = []
    const portal = await h.api('POST', '/billing/portal', { token: u.token })
    strictEqual(portal.status, 201, text(portal.body))
    strictEqual(portal.body.url, 'https://billing.stripe.test/p/session')
    strictEqual(seen[0].path, '/v1/billing_portal/sessions')
    strictEqual(seen[0].form.get('customer'), 'cus_123')
  })

  test('Stripe changes of the subscription follow the plan: upgrade, cancel, delete', async () => {
    const updated = (status: string, price: string) => ({ type: 'customer.subscription.updated', data: { object: { id: 'sub_123', status, items: { data: [{ price: { id: price } }] } } } })
    strictEqual(await hook(updated('active', PRICES.premium)), 200)
    strictEqual(await planOf(u), 'premium', 'the plan follows the price in the portal')
    strictEqual(await hook(updated('past_due', PRICES.pro)), 200)
    strictEqual(await planOf(u), 'premium', 'a late payment alone does not end the plan')
    strictEqual(await hook(updated('canceled', PRICES.premium)), 200)
    strictEqual(await planOf(u), 'free')
    await hook(completed(u.id, { subscription: 'sub_456' }, { plan: 'pro' }))
    strictEqual(await planOf(u), 'pro')
    strictEqual(await hook({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_456' } } }), 200)
    strictEqual(await planOf(u), 'free')
    strictEqual((await h.api('POST', '/billing/checkout', { token: u.token, body: { plan: 'pro' } })).status, 201, 'after the end a new subscription is possible')
    strictEqual((await h.api('POST', '/billing/plan', { token: u.token, body: { plan: 'free' } })).status, 201)
  })

  test('a half-configured Stripe refuses payments: no charge without a webhook secret, and no silent demo either', async () => {
    const w = await h.register('Half configured')
    process.env.ALLOW_DEMO_BILLING = 'true' // даже з ним: часткове налаштування не означає «демо»
    try {
      delete process.env.STRIPE_WEBHOOK_SECRET
      seen = []
      strictEqual((await h.api('POST', '/billing/checkout', { token: w.token, body: { plan: 'pro' } })).status, 503, 'without the webhook secret the plan could never turn on after paying')
      strictEqual(seen.length, 0, 'Stripe was not even called')
      configure()
      process.env.STRIPE_PRICE_PRO = 'prod_123'
      strictEqual((await h.api('POST', '/billing/checkout', { token: w.token, body: { plan: 'pro' } })).status, 503, 'a product id instead of a price id')
      strictEqual(await planOf(w), 'free', 'nothing was activated for free')
    } finally {
      configure()
      process.env.ALLOW_DEMO_BILLING = 'false'
    }
  })

  test('with Stripe configured the demo switch is ignored, also on the plain plan endpoint', async () => {
    const w = await h.register('Demo bypass')
    process.env.ALLOW_DEMO_BILLING = 'true'
    try {
      strictEqual((await h.api('POST', '/billing/plan', { token: w.token, body: { plan: 'premium' } })).status, 403)
      strictEqual(await planOf(w), 'free')
    } finally {
      process.env.ALLOW_DEMO_BILLING = 'false'
    }
  })

  test('the demo switch works only when nothing about Stripe is configured, and says so explicitly', async () => {
    const w = await h.register('Demo user')
    for (const k of ENV) delete process.env[k]
    process.env.ALLOW_DEMO_BILLING = 'true'
    try {
      const r = await h.api('POST', '/billing/checkout', { token: w.token, body: { plan: 'pro' } })
      strictEqual(r.status, 201)
      deepStrictEqual(r.body, { activated: true, plan: 'pro' }, 'an explicit demo answer, never a bare success')
      strictEqual(await planOf(w), 'pro')
    } finally {
      configure()
      process.env.ALLOW_DEMO_BILLING = 'false'
    }
  })

  test('repeated clicks and a second tab reuse one Stripe session (same idempotency key)', async () => {
    const w = await h.register('Double click')
    seen = []
    await Promise.all([h.api('POST', '/billing/checkout', { token: w.token, body: { plan: 'pro' } }), h.api('POST', '/billing/checkout', { token: w.token, body: { plan: 'pro' } })])
    strictEqual(seen.length, 2)
    ok(seen[0].idem && seen[0].idem === seen[1].idem, 'the same key: ' + seen[0].idem + ' / ' + seen[1].idem)
    seen = []
    await h.api('POST', '/billing/checkout', { token: w.token, body: { plan: 'premium' } })
    ok(seen[0].idem !== undefined, 'a different plan is a different request')
  })

  test('an old or repeated event cannot undo a newer one (out of order delivery)', async () => {
    const w = await h.register('Ordering')
    const at = Math.floor(Date.now() / 1000)
    const stamped = (event: object, created: number) => ({ ...event, created })
    const first = stamped(completed(w.id, { subscription: 'sub_order_1', customer: 'cus_order' }), at - 100)
    strictEqual(await hook(first), 200)
    strictEqual(await planOf(w), 'pro')
    strictEqual(await hook(stamped({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_order_1' } } }, at - 50)), 200)
    strictEqual(await planOf(w), 'free')
    strictEqual(await hook(first), 200, 'Stripe re-delivers the old event')
    strictEqual(await planOf(w), 'free', 'the cancelled subscription was not brought back')
    // новіша покупка після скасування працює
    strictEqual(await hook(stamped(completed(w.id, { subscription: 'sub_order_2', customer: 'cus_order' }), at)), 200)
    strictEqual(await planOf(w), 'pro')
    // запізніле оновлення зі старішим часом нічого не міняє
    const old = { type: 'customer.subscription.updated', data: { object: { id: 'sub_order_2', status: 'active', items: { data: [{ price: { id: PRICES.premium } }] } } } }
    strictEqual(await hook(stamped(old, at - 10)), 200)
    strictEqual(await planOf(w), 'pro', 'an older update is ignored')
    strictEqual(await hook(stamped(old, at + 10)), 200)
    strictEqual(await planOf(w), 'premium', 'a newer one is applied')
  })

  test('a second paid subscription does not replace the active one, and the profile says the user is subscribed', async () => {
    const w = await h.register('Duplicate')
    strictEqual((await h.api('GET', '/profile', { token: w.token })).body.subscribed, false)
    await hook(completed(w.id, { subscription: 'sub_dup_1', customer: 'cus_dup' }))
    strictEqual((await h.api('GET', '/profile', { token: w.token })).body.subscribed, true)
    await hook(completed(w.id, { subscription: 'sub_dup_2', customer: 'cus_dup' }, { plan: 'premium' }))
    strictEqual(await planOf(w), 'pro', 'the first subscription stays, the duplicate must be refunded by hand (it is logged as an error)')
    await hook({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_dup_2' } } })
    strictEqual(await planOf(w), 'pro', 'cancelling the unknown duplicate does not touch the active plan')
    await hook({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_dup_1' } } })
    strictEqual(await planOf(w), 'free')
    strictEqual((await h.api('GET', '/profile', { token: w.token })).body.subscribed, false)
  })

  test('subscription details from Stripe are stored: status, cancelling at the period end, renewal date (both field places)', async () => {
    const w = await h.register('Details')
    const overview = async () => (await h.api('GET', '/billing', { token: w.token })).body
    const at = Math.floor(Date.now() / 1000)
    const stamped = (event: object, created: number) => ({ ...event, created })
    await hook(stamped(completed(w.id, { subscription: 'sub_det_1', customer: 'cus_det' }), at))
    let b = await overview()
    strictEqual(b.subscription.status, 'active', 'a paid checkout means an active subscription')
    strictEqual(b.options.canManage, true)

    // нові версії API Stripe (2025-06-30.basil) віддають дату поновлення в елементі підписки, старі — в самій підписці
    const inItem = Math.floor(Date.now() / 1000) + 30 * 86400
    const created = { type: 'customer.subscription.created', data: { object: { id: 'sub_det_1', status: 'active', cancel_at_period_end: false, items: { data: [{ price: { id: PRICES.pro }, current_period_end: inItem }] } } } }
    strictEqual(await hook(stamped(created, at + 1)), 200)
    b = await overview()
    strictEqual(b.subscription.currentPeriodEnd, new Date(inItem * 1000).toISOString(), 'the date inside items.data[0]')
    strictEqual(b.subscription.cancelAtPeriodEnd, false)

    const onTop = inItem + 86400
    const canceling = { type: 'customer.subscription.updated', data: { object: { id: 'sub_det_1', status: 'active', cancel_at_period_end: true, current_period_end: onTop, items: { data: [{ price: { id: PRICES.pro } }] } } } }
    strictEqual(await hook(stamped(canceling, at + 2)), 200)
    b = await overview()
    strictEqual(b.subscription.cancelAtPeriodEnd, true)
    strictEqual(b.subscription.currentPeriodEnd, new Date(onTop * 1000).toISOString(), 'the date on the subscription itself')
    strictEqual(b.plan, 'pro', 'still pro until the period ends')

    const late = { type: 'customer.subscription.updated', data: { object: { id: 'sub_det_1', status: 'past_due', cancel_at_period_end: false, current_period_end: onTop, items: { data: [{ price: { id: PRICES.pro } }] } } } }
    strictEqual(await hook(stamped(late, at + 3)), 200)
    b = await overview()
    strictEqual(b.options.needsPaymentFix, true)
    strictEqual(b.plan, 'pro', 'past_due only warns')

    strictEqual(await hook(stamped({ type: 'customer.subscription.updated', data: { object: { id: 'sub_det_1', status: 'active', cancel_at_period_end: true, current_period_end: onTop, items: { data: [{ price: { id: PRICES.pro } }] } } } }, at + 1)), 200)
    strictEqual((await overview()).options.needsPaymentFix, true, 'an older event does not undo the newer past_due state')

    strictEqual(await hook(stamped({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_det_1' } } }, at + 4)), 200)
    b = await overview()
    strictEqual(b.plan, 'free')
    strictEqual(b.subscription, null)
    deepStrictEqual(b.options, { canUpgradeTo: ['pro', 'premium'], canManage: false, needsPaymentFix: false })
  })

  test('a subscription belongs to one user: another user is not affected', async () => {
    strictEqual(await planOf(v), 'free')
    strictEqual(await hook({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_unknown' } } }), 200)
    strictEqual(await planOf(v), 'free')
  })
})

describe('email verification and password reset', () => {
  const tokenIn = (mail: { text: string }) => /token=([\w-]+)/.exec(mail.text)?.[1] ?? ''
  const lastMailTo = (email: string) => [...h.outbox].reverse().find((m) => m.to === email)
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let u: Awaited<ReturnType<Harness['register']>>
  before(async () => {
    u = await h.register('Олена')
  })

  test('registration sends a confirmation email; the link confirms the address once', async () => {
    const mail = lastMailTo(u.email)
    ok(mail, 'a confirmation email was sent')
    ok(/#\/verify-email\?token=/.test(mail.text), mail.text)
    strictEqual((await h.api('GET', '/auth/me', { token: u.token })).body.emailVerified, false)
    const token = tokenIn(mail)
    ok(!(await h.users.findByPk(u.id)).emailVerifyHash?.includes(token), 'the database holds a hash, never the token itself')

    const done = await h.api('POST', '/auth/verify-email', { body: { token } })
    strictEqual(done.status, 201)
    strictEqual(done.body.emailVerified, true)
    strictEqual((await h.api('GET', '/auth/me', { token: u.token })).body.emailVerified, true)
    strictEqual((await h.api('POST', '/auth/verify-email', { body: { token } })).status, 400, 'the link works once')
    strictEqual((await h.api('POST', '/auth/resend-verification', { token: u.token })).status, 400, 'nothing to resend once confirmed')
    strictEqual((await h.api('POST', '/auth/verify-email', { body: { token: 'x'.repeat(43) } })).status, 400, 'an unknown token')
    strictEqual((await h.api('POST', '/auth/resend-verification')).status, 401)
  })

  test('forgot-password answers the same for a known and an unknown address, and mails only the known one', async () => {
    const before = h.outbox.length
    const unknown = await h.api('POST', '/auth/forgot-password', { body: { email: 'nobody-at-all@example.com' } })
    const known = await h.api('POST', '/auth/forgot-password', { body: { email: u.email.toUpperCase() }, lang: 'uk' })
    strictEqual(unknown.status, 201)
    strictEqual(known.status, 201)
    deepStrictEqual(unknown.body, known.body, 'the response does not reveal whether the address exists')
    strictEqual(h.outbox.length, before + 1)
    const mail = lastMailTo(u.email)
    ok(/Скидання пароля/.test(mail.subject) && /Олена/.test(mail.text), 'the email is in the language of the request')
    ok(/#\/reset-password\?token=/.test(mail.text))
    strictEqual((await h.api('POST', '/auth/forgot-password', { body: { email: 'not-an-email' } })).status, 400)
  })

  test('a new password needs a valid token and the same rules as registration', async () => {
    const token = tokenIn(lastMailTo(u.email))
    strictEqual((await h.api('POST', '/auth/reset-password', { body: { token, password: 'short' } })).status, 400)
    strictEqual((await h.api('POST', '/auth/reset-password', { body: { token, password: 'я'.repeat(37) } })).status, 400, 'more than 72 bytes')
    strictEqual((await h.api('POST', '/auth/reset-password', { body: { token: 'y'.repeat(43), password: 'a brand new password' } })).status, 400)
    const reset = await h.api('POST', '/auth/reset-password', { body: { token, password: 'x' }, lang: 'uk' })
    strictEqual(reset.status, 400)
    ok(!(await h.users.findByPk(u.id)).passwordResetHash?.includes(token), 'the database holds a hash, never the token itself')
  })

  test('resetting the password: the link works once, the old password and old sessions stop working', async () => {
    await sleep(1100) // токен входу несе час видачі з точністю до секунди
    const token = tokenIn(lastMailTo(u.email))
    const reset = await h.api('POST', '/auth/reset-password', { body: { token, password: 'a brand new password' } })
    strictEqual(reset.status, 201, text(reset.body))
    strictEqual((await h.api('POST', '/auth/reset-password', { body: { token, password: 'another new password' } })).status, 400, 'the link is single-use')
    strictEqual((await h.api('POST', '/auth/login', { body: { email: u.email, password: u.password } })).status, 401, 'the old password no longer works')
    const fresh = await h.api('POST', '/auth/login', { body: { email: u.email, password: 'a brand new password' } })
    strictEqual(fresh.status, 201)
    strictEqual((await h.api('GET', '/auth/me', { token: u.token })).status, 401, 'a session from before the reset is closed')
    strictEqual((await h.api('GET', '/auth/me', { token: fresh.body.token })).status, 200, 'a session after the reset works')
  })

  test('an expired link is refused', async () => {
    await h.api('POST', '/auth/forgot-password', { body: { email: u.email } })
    const token = tokenIn(lastMailTo(u.email))
    await h.users.update({ passwordResetExpires: new Date(Date.now() - 1000) }, { where: { id: u.id } })
    strictEqual((await h.api('POST', '/auth/reset-password', { body: { token, password: 'yet another password' } })).status, 400)
  })

  test('a third request for one address in an hour is accepted but sends no more mail', async () => {
    const mails = () => h.outbox.filter((m) => m.to === u.email && /reset/i.test(m.subject + m.text)).length
    const start = mails()
    for (let i = 0; i < 5; i++) strictEqual((await h.api('POST', '/auth/forgot-password', { body: { email: u.email } })).status, 201)
    ok(mails() - start <= 2, 'at most 3 reset emails per address per hour in total, so at most 2 more here')
  })
})

describe('tarot flows', () => {
  let u: Awaited<ReturnType<Harness['register']>>
  before(async () => {
    h.resetLimits()
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

  test('the AI assistant is gone: its routes do not exist any more', async () => {
    for (const [method, path] of [['POST', '/companion/chat'], ['GET', '/companion/personas'], ['GET', '/messages'], ['POST', '/messages'], ['DELETE', '/messages']] as const) {
      strictEqual((await h.api(method, path, { token: u.token, body: method === 'POST' ? { text: 'hi' } : undefined })).status, 404, method + ' ' + path)
    }
  })
})

describe('plan limits and the billing overview', () => {
  type User = Awaited<ReturnType<Harness['register']>>
  const draw = (u: User, mode = 'quick') => h.api('POST', '/tarot/readings', { token: u.token, body: { spreadId: 'three', deck: 'Classic Tarot', mode } })
  const cards = [{ id: 0, reversed: false }, { id: 1, reversed: true }, { id: 2, reversed: false }]
  const dream = (u: User, n: number) => h.api('POST', '/dreams', { token: u.token, body: { title: 'Dream ' + n, text: 'text ' + n } })
  const billing = async (u: User) => (await h.api('GET', '/billing', { token: u.token })).body
  const withPlan = async (u: User, plan: string) => void (await h.users.update({ plan }, { where: { id: u.id } }))
  const isLimit = (r: { status: number; body: any }, limit: string) => {
    strictEqual(r.status, 403, text(r.body))
    strictEqual(r.body.code, 'PLAN_LIMIT')
    strictEqual(r.body.limit, limit)
    ok(typeof r.body.message === 'string' && r.body.message.length > 10, 'a message that says what to do')
  }
  // ліміт реєстрацій діє на всю адресу (10 за годину): перед кожним новим користувачем обнуляємо лічильники
  const fresh = (name: string) => (h.resetLimits(), h.register(name))
  let free: User, pro: User, premium: User
  before(async () => {
    free = await fresh('Free user')
    pro = await fresh('Pro user')
    premium = await fresh('Premium user')
    await withPlan(pro, 'pro')
    await withPlan(premium, 'premium')
  })

  test('the public plan list carries the limits', async () => {
    const list = (await h.api('GET', '/plans')).body
    strictEqual(list[0].limits.readingsPerMonth, 5)
    strictEqual(list[1].limits.readingsPerMonth, 30)
    strictEqual(list[2].limits.readingsPerMonth, null)
    deepStrictEqual(list[2].limits.readingModes, ['quick', 'detailed', 'depth'])
  })

  test('free: the sixth reading of the month is refused with PLAN_LIMIT, in the request language, and the overview shows it', async () => {
    const u = await fresh('Reader')
    for (let i = 1; i <= 5; i++) strictEqual((await draw(u)).status, 201, 'reading ' + i)
    const sixth = await draw(u)
    isLimit(sixth, 'readingsPerMonth')
    ok(/5/.test(sixth.body.message) && /Upgrade to Pro/.test(sixth.body.message), sixth.body.message)
    const uk = await h.api('POST', '/tarot/readings', { token: u.token, body: { spreadId: 'three', deck: 'Classic Tarot', mode: 'quick' }, lang: 'uk' })
    ok(/[А-Яа-яІіЇїЄє]/.test(uk.body.message), uk.body.message)
    const b = await billing(u)
    strictEqual(b.usage.readingsThisMonth, 5, 'a refused attempt is not counted')
    strictEqual(b.remaining.readings, 0)
  })

  test('free: detailed and depth readings are not available, and a refused mode costs nothing', async () => {
    const u = await fresh('Moods')
    isLimit(await draw(u, 'detailed'), 'readingMode')
    isLimit(await draw(u, 'depth'), 'readingMode')
    strictEqual((await billing(u)).usage.readingsThisMonth, 0)
    strictEqual((await draw(u, 'quick')).status, 201)
  })

  test('pro has detailed but not depth; premium has depth', async () => {
    strictEqual((await draw(pro, 'detailed')).status, 201)
    isLimit(await draw(pro, 'depth'), 'readingMode')
    strictEqual((await draw(premium, 'depth')).status, 201)
    for (let i = 0; i < 6; i++) strictEqual((await draw(pro)).status, 201, 'pro reading ' + i)
  })

  test('pro has a monthly cap of 30 readings and is then pointed to Premium; premium has none', async () => {
    const p = await fresh('Pro heavy user')
    await withPlan(p, 'pro')
    for (let i = 1; i <= 30; i++) strictEqual((await draw(p)).status, 201, 'reading ' + i)
    const over = await draw(p)
    isLimit(over, 'readingsPerMonth')
    ok(/30/.test(over.body.message) && /Upgrade to Premium/.test(over.body.message), over.body.message)
    const b = await billing(p)
    strictEqual(b.usage.readingsThisMonth, 30)
    strictEqual(b.remaining.readings, 0)
    deepStrictEqual(b.options.canUpgradeTo, ['premium'])
    for (let i = 0; i < 8; i++) strictEqual((await draw(premium)).status, 201, 'premium reading ' + i)
    strictEqual((await billing(premium)).remaining.readings, null)
  })

  test('turning autosave off does not get around the reading limit', async () => {
    const u = await fresh('No autosave')
    await h.api('PATCH', '/settings', { token: u.token, body: { autosave: false } })
    for (let i = 0; i < 5; i++) {
      const r = await draw(u)
      strictEqual(r.status, 201)
      strictEqual(r.body.temporary, true)
    }
    isLimit(await draw(u), 'readingsPerMonth')
  })

  test('POST /spreads counts as a reading too, and a bad request is not counted', async () => {
    const u = await fresh('Importer')
    const bad = await h.api('POST', '/spreads', { token: u.token, body: { spreadId: 'three', cards: [{ id: 5, reversed: false }, { id: 5, reversed: false }, { id: 6, reversed: false }] } })
    strictEqual(bad.status, 400)
    strictEqual((await billing(u)).usage.readingsThisMonth, 0, 'a request that created nothing used nothing')
    for (let i = 0; i < 5; i++) strictEqual((await h.api('POST', '/spreads', { token: u.token, body: { spreadId: 'three', cards } })).status, 201)
    isLimit(await h.api('POST', '/spreads', { token: u.token, body: { spreadId: 'three', cards } }), 'readingsPerMonth')
    // просмотр, збереження й видалення старих розкладів ліміт не чіпають
    const list = await h.api('GET', '/spreads', { token: u.token })
    strictEqual(list.status, 200)
    strictEqual((await h.api('PATCH', '/spreads/' + list.body[0].id, { token: u.token, body: { saved: true } })).status, 200)
  })

  test('free: the eleventh dream is refused, deleting one frees a place, pro has no cap', async () => {
    const u = await fresh('Dreamer')
    const ids: string[] = []
    for (let i = 1; i <= 10; i++) {
      const r = await dream(u, i)
      strictEqual(r.status, 201)
      ids.push(r.body.id)
    }
    isLimit(await dream(u, 11), 'dreamsTotal')
    strictEqual((await h.api('DELETE', '/dreams/' + ids[0], { token: u.token })).status, 204)
    strictEqual((await dream(u, 12)).status, 201)
    for (let i = 1; i <= 12; i++) strictEqual((await dream(pro, i)).status, 201)
  })

  test('compatibility is for pro and premium; the forecast of a free user has no week and month', async () => {
    for (const u of [free, pro]) await h.api('PATCH', '/profile', { token: u.token, body: { birthDate: '1990-05-05' } })
    isLimit(await h.api('POST', '/astrology/compatibility', { token: free.token, body: { birthDate: '1992-03-03' } }), 'compatibility')
    const compat = await h.api('POST', '/astrology/compatibility', { token: pro.token, body: { birthDate: '1992-03-03' } })
    strictEqual(compat.status, 201)
    // у тестах моделі немає: тлумачення від неї порожнє, а шаблонний text (розрахунок і розбір) на місці
    strictEqual(compat.body.summary, null)
    strictEqual(compat.body.source, 'local')
    ok(compat.body.text.length > 200 && compat.body.score >= 0)

    const f = (await h.api('GET', '/astrology/forecast?date=2026-06-15', { token: free.token })).body
    ok(f.day, 'today is included')
    strictEqual(f.week, null)
    strictEqual(f.month, null)
    deepStrictEqual(f.locked, ['week', 'month'])
    strictEqual(f.narratives, null, 'model texts are a paid feature')
    const p = (await h.api('GET', '/astrology/forecast?date=2026-06-15', { token: pro.token })).body
    ok(p.week && p.month)
    deepStrictEqual(p.locked, [])
    deepStrictEqual(p.narratives, { day: null, week: null, month: null }, 'paid plans ask for them; without a model they stay empty and the template texts show')
  })

  test('full reports stay for pro and above', async () => {
    const r = await h.api('POST', '/astrology/reports', { token: free.token })
    strictEqual(r.status, 403)
    strictEqual((await h.api('POST', '/astrology/reports', { token: pro.token })).status, 201)
  })

  test('the plan always comes from the database, never from the request', async () => {
    const u = await fresh('Cheater')
    strictEqual((await h.api('POST', '/tarot/readings', { token: u.token, body: { spreadId: 'three', deck: 'Classic Tarot', mode: 'depth', plan: 'premium' } })).status, 400, 'an unknown field is refused')
    isLimit(await draw(u, 'depth'), 'readingMode')
  })

  test('after a downgrade the data stays and only new things are blocked', async () => {
    const u = await fresh('Downgraded')
    await withPlan(u, 'pro')
    for (let i = 1; i <= 12; i++) strictEqual((await dream(u, i)).status, 201)
    await withPlan(u, 'free')
    strictEqual((await h.api('GET', '/dreams', { token: u.token })).body.length, 12, 'nothing is hidden or deleted')
    isLimit(await dream(u, 13), 'dreamsTotal')
    strictEqual((await h.api('GET', '/profile/export', { token: u.token })).status, 200, 'export stays available')
  })

  test('GET /billing for a free user', async () => {
    const u = await fresh('Overview')
    const b = await billing(u)
    strictEqual(b.plan, 'free')
    strictEqual(b.planName, 'Free')
    strictEqual(b.price, 0)
    strictEqual(b.subscription, null)
    strictEqual(b.limits.dreamsTotal, 10)
    deepStrictEqual(b.usage, { readingsThisMonth: 0, dreamsTotal: 0 })
    deepStrictEqual(b.remaining, { readings: 5, dreams: 10 })
    deepStrictEqual(b.options, { canUpgradeTo: ['pro', 'premium'], canManage: false, needsPaymentFix: false })
    ok(new Date(b.resets.readings).getUTCDate() === 1, 'resets at the start of the next month (UTC)')
    strictEqual((await h.api('GET', '/billing')).status, 401)
  })

  test('GET /billing for subscribers: active, canceling, payment problem, and a demo-activated paid plan', async () => {
    const u = await fresh('Subscriber')
    const end = new Date('2026-12-09T10:00:00.000Z')
    await h.users.update({ plan: 'pro', stripeCustomerId: 'cus_bill', stripeSubscriptionId: 'sub_bill', subscriptionStatus: 'active', cancelAtPeriodEnd: false, currentPeriodEnd: end }, { where: { id: u.id } })
    let b = await billing(u)
    strictEqual(b.plan, 'pro')
    strictEqual(b.price, 5)
    deepStrictEqual(b.subscription, { status: 'active', cancelAtPeriodEnd: false, currentPeriodEnd: end.toISOString() })
    deepStrictEqual(b.options, { canUpgradeTo: ['premium'], canManage: true, needsPaymentFix: false })
    deepStrictEqual(b.remaining, { readings: 30, dreams: 50 })

    await h.users.update({ cancelAtPeriodEnd: true }, { where: { id: u.id } })
    b = await billing(u)
    strictEqual(b.subscription.cancelAtPeriodEnd, true)
    strictEqual(b.options.needsPaymentFix, false)

    await h.users.update({ subscriptionStatus: 'past_due' }, { where: { id: u.id } })
    b = await billing(u)
    strictEqual(b.options.needsPaymentFix, true)
    strictEqual(b.plan, 'pro', 'a late payment alone does not take the plan away')

    await h.users.update({ plan: 'premium', stripeCustomerId: null, stripeSubscriptionId: null, subscriptionStatus: null, cancelAtPeriodEnd: false, currentPeriodEnd: null }, { where: { id: u.id } })
    b = await billing(u)
    strictEqual(b.subscription, null, 'no Stripe subscription: a demo plan')
    deepStrictEqual(b.options, { canUpgradeTo: [], canManage: false, needsPaymentFix: false })
  })
})

describe('brute force protection (runs last: it uses up the address limits)', () => {
  before(() => h.resetLimits())

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

  test('one address cannot ask for an unlimited number of reset emails', async () => {
    let blocked = 0
    for (let i = 0; i < 12 && !blocked; i++) {
      const r = await h.api('POST', '/auth/forgot-password', { body: { email: `nobody-${i}@example.com` } })
      if (r.status === 429) blocked = i + 1
      else strictEqual(r.status, 201)
    }
    ok(blocked > 0, 'a 429 appeared before 12 requests')
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
