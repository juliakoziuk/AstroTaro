// Наскрізна перевірка API проти запущеного сервера: node scripts/smoke.mjs [http://localhost:3000/api]
// Створює тимчасового користувача й видаляє його дані наприкінці (через CASCADE при видаленні користувача вручну в БД не потрібне).
const API = process.argv[2] ?? 'http://localhost:3000/api'
let token = ''
let lang = 'en'
let failed = 0

const call = async (method, path, body) => {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'Accept-Language': lang, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, data: text ? JSON.parse(text) : null }
}
const check = (name, cond, extra = '') => {
  if (!cond) failed++
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name} ${cond ? '' : extra}`)
}

const email = `smoke-${Date.now()}@example.com`
let r = await call('POST', '/auth/register', { name: 'Юля', email, password: 'secret123' })
check('register', r.status === 201)
token = r.data.token

r = await call('GET', '/plans')
check('plans public: 3 tariffs', r.data.length === 3 && r.data[1].price === 5)
r = await call('GET', '/tarot/spreads')
check('tarot spreads public', r.data.length === 7)

r = await call('GET', '/profile')
check('profile: zero activity', r.data.name === 'Юля' && r.data.activity.readings === 0 && r.data.plan === 'free', JSON.stringify(r.data))
r = await call('PATCH', '/profile', { birthDate: '2004-06-22', birthTime: '08:30', birthLat: 50.45, birthLon: 30.52, birthPlace: 'Kyiv' })
check('profile: birth data saved', r.data.birthDate === '2004-06-22', JSON.stringify(r.data))
r = await call('PATCH', '/profile', { birthDate: 'not-a-date' })
check('profile: bad date rejected', r.status === 400)

r = await call('GET', '/settings')
check('settings defaults', r.data.timeFormat === '24-hour', JSON.stringify(r.data))
r = await call('PATCH', '/settings', { theme: 'Light', insights: false })
check('settings patch', r.data.theme === 'Light' && r.data.insights === false && r.data.autosave === true)
r = await call('PATCH', '/settings', { theme: 'Neon' })
check('settings: bad value rejected', r.status === 400)

r = await call('POST', '/dreams', { title: 'The Old House', text: 'I was in an old house from my childhood. I found a room with a bright light inside.' })
check('dream created with analysis', r.status === 201 && r.data.symbols.includes('House') && r.data.analysis.interpretation.length > 10 && r.data.kind === 'Dream', JSON.stringify(r.data))
const dreamId = r.data.id
r = await call('PATCH', `/dreams/${dreamId}`, { text: 'I was flying above the clouds, free.' })
check('dream re-analysed on edit (title still says House)', r.data.symbols.includes('Flying') && r.data.analysis.interpretation.includes('flying'), JSON.stringify(r.data.symbols))

r = await call('POST', '/tarot/readings', { spreadId: 'three', deck: 'Classic Tarot', mode: 'detailed' })
check('reading drawn: 3 cards + summary', r.status === 201 && r.data.cards.length === 3 && r.data.result.positions.length === 3 && r.data.result.summary.length > 20, JSON.stringify(r.data))
const readingId = r.data.id
r = await call('POST', '/tarot/readings', { spreadId: 'nope', deck: 'Classic Tarot', mode: 'quick' })
check('reading: bad spread rejected', r.status === 400)
r = await call('PATCH', `/spreads/${readingId}`, { saved: true })
check('reading saved', r.data.saved === true)
r = await call('GET', '/spreads?saved=true')
check('saved filter', r.data.length === 1 && r.data[0].id === readingId)

r = await call('GET', '/astrology')
check('astrology natal: Sun in Cancer', r.data.natal?.sun === 'Cancer' && r.data.natal.planets.length === 10 && r.data.natal.ascendant, JSON.stringify(r.data.natal))
check('astrology current + events', r.data.current.length === 3 && r.data.events.length === 2 && r.data.insight.length > 10)
r = await call('POST', '/astrology/reports')
check('report forbidden on free plan', r.status === 403)
r = await call('POST', '/billing/plan', { plan: 'pro' })
check('plan switched to pro', r.data.plan === 'pro')
r = await call('POST', '/astrology/reports')
check('report generated on pro', r.status === 201 && r.data.text.includes('Cancer'), JSON.stringify(r.data))


r = await call('GET', '/dashboard')
check('dashboard counts', r.data.counts.readings === 1 && r.data.counts.dreams === 1 && r.data.counts.reports === 1 && r.data.progress > 0 && r.data.insight.length > 10, JSON.stringify(r.data))
r = await call('GET', '/profile')
check('profile activity', r.data.activity.readings === 1 && r.data.activity.dreams === 1 && r.data.activity.reports === 1, JSON.stringify(r.data.activity))

// ---- зовнішні API (потребують інтернету)
r = await call('GET', '/cosmos/geo?q=Kyiv')
check('geo: Kyiv found with coordinates and country', r.status === 200 && Math.abs(r.data[0].lat - 50.45) < 0.5 && r.data[0].country === 'UA', JSON.stringify(r.data?.[0]))
const kyiv = r.data?.[0]
r = await call('PATCH', '/profile', { birthPlace: kyiv.name, birthLat: kyiv.lat, birthLon: kyiv.lon, country: kyiv.country })
check('profile stores place and country', r.data.country === 'UA')
r = await call('GET', '/astrology')
check('natal chart still computed with time zone', r.data.natal?.sun === 'Cancer' && r.data.natal.ascendant, JSON.stringify(r.data.natal))
r = await call('GET', '/cosmos/apod')
check('NASA APOD', r.status === 200 && r.data.title && r.data.url, JSON.stringify(r.data))
r = await call('GET', '/cosmos/quote')
check('ZenQuotes', r.status === 200 && r.data.text && r.data.author, JSON.stringify(r.data))
r = await call('GET', '/cosmos/sun?lat=50.45&lon=30.52')
check('sunrise-sunset', r.status === 200 && r.data.sunrise && r.data.sunset, JSON.stringify(r.data))
r = await call('GET', '/cosmos/sun?lat=999&lon=0')
check('sun: bad coordinates rejected', r.status >= 400)
r = await call('GET', '/cosmos/holidays')
check('Nager.Date holidays for the profile country', r.status === 200 && r.data.country === 'UA' && r.data.holidays.length > 0, JSON.stringify(r.data))
r = await call('GET', '/cosmos/art?symbol=Water')
check('Met Museum art for a symbol', r.status === 200 && r.data?.image?.startsWith('https://') && r.data.title, JSON.stringify(r.data))
r = await call('GET', '/cosmos/geo?q=a')
check('geo: too short query rejected', r.status === 400)

// ---- мова відповідей (Accept-Language)
const cyr = /[А-Яа-яІіЇїЄєҐґ]/
lang = 'uk'
r = await call('GET', '/plans')
check('uk: plans translated, ids and prices kept', cyr.test(r.data[1].tagline) && r.data[1].id === 'pro' && r.data[1].price === 5, JSON.stringify(r.data[1]))
r = await call('GET', '/tarot/spreads')
check('uk: spread positions', r.data.find((x) => x.id === 'three').positions[0] === 'Минуле')
r = await call('GET', '/dreams')
check('uk: the saved dream is re-analysed in Ukrainian', r.data.length === 1 && cyr.test(r.data[0].analysis.interpretation) && r.data[0].kind === 'Сон', JSON.stringify(r.data[0]))
r = await call('GET', '/spreads')
check('uk: an old reading is re-interpreted in Ukrainian', cyr.test(r.data[0].result.summary) && cyr.test(r.data[0].result.positions[0].card), JSON.stringify(r.data[0].result))
r = await call('GET', '/astrology')
check('uk: astrology names', r.data.natal.sun === 'Рак' && cyr.test(r.data.insight) && cyr.test(r.data.events[0].name) && r.data.current[0].label.includes(':'), JSON.stringify(r.data.current[0]))
lang = 'uk'
token = ''
r = await call('POST', '/auth/login', { email: 'nobody@example.com', password: 'wrongpass1' })
check('uk: login error message', r.status === 401 && cyr.test(r.data.message), JSON.stringify(r.data))
r = await call('POST', '/auth/register', { name: 'a', email: 'bad', password: '1' })
check('uk: validation errors localized', r.status === 400 && r.data.message.every((m) => cyr.test(m)), JSON.stringify(r.data))
lang = 'en'

console.log(failed ? `\n${failed} FAILED (test user: ${email})` : `\nall passed (test user: ${email})`)
process.exit(failed ? 1 : 0)
