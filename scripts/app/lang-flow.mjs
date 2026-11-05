// Наскрізна перевірка зміни мови (потрібні запущені фронтенд і бекенд): node scripts/app/lang-flow.mjs
// Користувач відкриває Settings → вкладка Language → обирає мову; перевіряємо, що змінились інтерфейс, дані з сервера
// (сни, астрологія, відповідь AI) і поле Language в налаштуваннях акаунта. PNG: node_modules/.cache/app-shots/lang-*.png
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../landing-diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'node_modules/.cache/app-shots')
const API = process.env.API || 'http://localhost:3000/api'
const BASE = process.env.URL || 'http://localhost:5173/app.html?clean=1'
const cyr = /[А-Яа-яІіЇїЄєҐґ]/
let failed = 0
const check = (name, ok, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${ok ? '' : extra}`)
}

const call = async (m, p, body, token, lang = 'en') =>
  (await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', 'Accept-Language': lang, ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })).json()

// чистий користувач з англійською мовою акаунта
const email = `lang-${Date.now()}@example.com`
const { token } = await call('POST', '/auth/register', { name: 'Lang', email, password: 'secret123' })
await call('POST', '/dreams', { title: 'Old house', text: 'I was in an old house from my childhood and found a bright light inside.' }, token)
await call('PATCH', '/profile', { birthDate: '2004-06-22' }, token)

fs.mkdirSync(OUT, { recursive: true })
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: 1536, height: 1024 })
await page.evaluateOnNewDocument((t) => {
  localStorage.setItem('astrotarot.token', t)
  localStorage.setItem('astrotarot.lang', 'en')
}, token)

const texts = () => page.evaluate(() => [...document.querySelectorAll('.stage .t, .lang-opt, .empty h3, .bubble')].map((e) => e.textContent.trim()).filter(Boolean).join(' | '))
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const open = async (route) => {
  await page.goto(`${BASE}#/${route}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await wait(1800)
}

await open('dreams')
let t = await texts()
check('starts in English', /Dream Journal/.test(t) && /House/.test(t) && !cyr.test(t), t.slice(0, 200))

await open('settings')
await page.click('button[aria-label="Language"]')
await wait(500)
t = await texts()
check('the Language tab shows three languages', /English/.test(t) && /Українська/.test(t) && /Español/.test(t), t.slice(0, 200))
await page.screenshot({ path: path.join(OUT, 'lang-panel-en.png') })

await page.evaluate(() => [...document.querySelectorAll('.lang-opt')].find((b) => b.textContent.includes('Українська')).click())
await wait(2200)
t = await texts()
check('the interface switched to Ukrainian immediately', /Налаштування/.test(t) && !/Customize your experience/.test(t), t.slice(0, 200))
const settings = await call('GET', '/settings', null, token)
check('the choice is saved in the account', settings.language === 'Ukrainian', JSON.stringify(settings))
await page.screenshot({ path: path.join(OUT, 'lang-panel-uk.png') })

await open('dreams')
t = await texts()
check('dreams: tags and interpretation come from the server in Ukrainian', /Будинок/.test(t) && /Щоденник снів/.test(t), t.slice(0, 300))
await open('astrology')
t = await texts()
check('astrology: signs are Ukrainian', /Рак/.test(t) && /Планети/.test(t), t.slice(0, 300))

// відповідь AI мовою інтерфейсу
await open('companion')
await page.evaluate(() => [...document.querySelectorAll('a[aria-label]')].find((a) => a.getAttribute('aria-label') === 'Астролог').click())
await wait(1200)
const input = await page.$('input[name=msg]')
await input.type('Що чекає цього тижня?')
await page.keyboard.press('Enter')
await wait(2500)
t = await texts()
const answer = await page.evaluate(() => [...document.querySelectorAll('.bubble:not(.me)')].pop()?.textContent ?? '')
check('the AI replies in Ukrainian', cyr.test(answer) && /просто зараз/i.test(answer), answer.slice(0, 200))
await page.screenshot({ path: path.join(OUT, 'lang-companion-uk.png') })

// після перезавантаження мова береться з налаштувань акаунта, а не лише з браузера
await page.evaluate(() => localStorage.setItem('astrotarot.lang', 'en'))
await open('settings')
t = await texts()
check('after a reload the account language wins over the local one', /Налаштування/.test(t), t.slice(0, 200))

// профіль: вибір мови зі списку також перемикає все
await open('profile')
await page.select('select[aria-label=lang]', 'Spanish')
await wait(2200)
t = await texts()
check('profile: choosing Spanish switches the interface', /Perfil/.test(t) && /Cerrar sesión/.test(t), t.slice(0, 200))

await browser.close()
// прибираємо тестового користувача
console.log(failed ? `\n${failed} FAILED (user ${email})` : `\nall passed (user ${email})`)
process.exit(failed ? 1 : 0)
