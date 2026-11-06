// Знімки екранів застосунку з потрібною мовою (потрібні запущені фронтенд і бекенд: npm run run:all).
//   node scripts/app/shot.mjs dreams,analysis            → англійська
//   LANG_ID=uk node scripts/app/shot.mjs dashboard       → українська
//   TEXTS=1 LANG_ID=uk node scripts/app/shot.mjs all     → ще й друкує видимі тексти екрана
// Користувач shot@example.com створюється, якщо його немає; PNG лежать у node_modules/.cache/app-shots.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../landing-diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'node_modules/.cache/app-shots')
const API = process.env.API || 'http://localhost:3000/api'
const BASE = process.env.URL || 'http://localhost:5173/app.html?clean=1'
const LANG = process.env.LANG_ID || 'en'
const ALL = ['dashboard', 'tarot', 'reading', 'dreams', 'analysis', 'astrology', 'companion', 'profile', 'settings', 'pricing', 'today']
const routes = (process.argv[2] ?? 'dashboard') === 'all' ? ALL : process.argv[2].split(',')

async function token() {
  const body = (extra) => JSON.stringify({ email: 'shot@example.com', password: 'secret123', ...extra })
  const call = (p, b) => fetch(API + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: b })
  let res = await call('/auth/login', body())
  if (res.status === 401) res = await call('/auth/register', body({ name: 'Shot' }))
  return (await res.json()).token
}

fs.mkdirSync(OUT, { recursive: true })
const jwt = await token()
// мова акаунта на сервері важливіша за локальну, тож виставляємо її й там
const SETTING = { en: 'English', uk: 'Ukrainian' }
await fetch(API + '/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt }, body: JSON.stringify({ language: SETTING[LANG] }) })
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 })
await page.evaluateOnNewDocument((t, lang) => {
  localStorage.setItem('astrotarot.token', t)
  localStorage.setItem('astrotarot.lang', lang)
}, jwt, LANG)
for (const route of routes) {
  await page.goto(`${BASE}#/${route}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
  })
  await new Promise((r) => setTimeout(r, 2500))
  const file = path.join(OUT, `${route}-${LANG}.png`)
  await page.screenshot({ path: file })
  console.log('saved', file)
  if (process.env.TEXTS) {
    const texts = await page.evaluate(() => [...document.querySelectorAll('.stage .t, .today h1, .today h2, .today p, .toast, .mdl h2, .mdl label, .bubble')].map((e) => e.textContent.trim()).filter(Boolean))
    console.log(`  ${route}: ${texts.join(' | ')}`)
  }
}
await browser.close()
