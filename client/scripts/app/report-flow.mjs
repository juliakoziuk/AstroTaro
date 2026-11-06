// Наскрізна перевірка звітів (потрібні запущені фронтенд і бекенд): node scripts/app/report-flow.mjs
// Free: «Generate Report» пояснює тариф; Pro: звіт показується одразу; «My Reports» у профілі показує список.
import { launch } from '../landing-diff.mjs'

const API = process.env.API || 'http://localhost:3000/api'
const BASE = process.env.URL || 'http://localhost:5173/app.html?clean=1'
let failed = 0
const check = (name, ok, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${ok ? '' : extra}`)
}
const call = async (m, p, body, token) =>
  (await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })).json()

const { token } = await call('POST', '/auth/register', { name: 'Rep', email: `rep-${Date.now()}@example.com`, password: 'secret123' })
await call('PATCH', '/profile', { birthDate: '2004-06-22' }, token)

const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: 1536, height: 1024 })
await page.evaluateOnNewDocument((t) => localStorage.setItem('astrotarot.token', t), token)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const dialog = () => page.evaluate(() => document.querySelector('.mdl')?.innerText.replace(/\n+/g, ' | ') ?? '')
const open = async (route) => {
  await page.goto(`${BASE}#/${route}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await wait(1800)
}

await open('astrology')
await page.click('a[aria-label="Generate Report"]')
await wait(600)
let d = await dialog()
check('free plan: a dialog explains the plan (no silent redirect)', /Full astrology report/.test(d) && /Pro and Premium/.test(d) && (await page.evaluate(() => location.hash)).includes('astrology'), d)
await page.evaluate(() => [...document.querySelectorAll('.mdl button')].find((b) => b.textContent === 'See plans').click())
await wait(800)
check('the dialog leads to the plans', (await page.evaluate(() => location.hash)).includes('pricing'))

await call('POST', '/billing/plan', { plan: 'pro' }, token)
await open('astrology')
await page.click('a[aria-label="Generate Report"]')
await wait(1500)
d = await dialog()
check('pro plan: the report is shown right away', /Natal report/.test(d) && /Cancer/.test(d), d.slice(0, 200))
const sections = await page.evaluate(() => [...document.querySelectorAll('.report-section h3')].map((h) => h.textContent))
check('the full report has six or seven sections (houses appear with birth time and place)', (sections.length === 6 || sections.length === 7) && sections.includes('Key aspects'), sections.join(' | '))
check('the report is long enough to be a real report', d.length > 1800, String(d.length))
await page.screenshot({ path: 'node_modules/.cache/app-shots/report-en.png' })
await page.keyboard.press('Escape')
await wait(300)
check('Esc closes the report', (await dialog()) === '')

await open('profile')
await page.click('a[aria-label="My Reports"]')
await wait(1200)
d = await dialog()
check('profile: My Reports lists the report', /My Reports/.test(d) && /Natal report/.test(d), d)
await page.evaluate(() => document.querySelector('.report-row > button').click())
await wait(300)
d = await dialog()
check('a report expands to its text', /Planets/.test(d) && /Moon phase at birth/.test(d), d.slice(0, 200))

await browser.close()
console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
