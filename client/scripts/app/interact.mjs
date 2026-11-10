// Перевірка інтерактивності єдиного React-застосунку (app.html) в Chrome:
//   1) усі 13 екранів відкриваються; 2) КОЖНЕ посилання з даних екранів реально веде на свій екран;
//   3) переходи клієнтські (сторінка не перезавантажується); 4) «назад» і кнопка браузера; 5) перемикач екранів і клавіші;
//   6) контроли; 7) старі адреси landing.html / login.html; 8) помилок у консолі немає.
//   node scripts/app/interact.mjs          (потрібен запущений npm run dev; BASE=... для іншого хоста)
import fs from 'node:fs'
import path from 'node:path'
import { launch } from '../landing-diff.mjs'
import { SCREENS, root } from './common.mjs'

const BASE = process.env.BASE || 'http://localhost:5173'
const results = []
const ok = (name, pass, extra = '') => results.push({ перевірка: name, результат: pass ? 'ОК' : 'ПОМИЛКА', деталі: String(extra).slice(0, 110) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const data = Object.fromEntries(SCREENS.filter((s) => fs.existsSync(path.join(root, `src/app/data/${s.id}.json`))).map((s) => [s.route, JSON.parse(fs.readFileSync(path.join(root, `src/app/data/${s.id}.json`), 'utf8'))]))
const ALL = ['/', '/login', ...Object.keys(data)]

const browser = await launch()
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 120)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)))
  await page.setViewport({ width: 1536, height: 1024 })
  const route = () => page.evaluate(() => location.hash.replace('#', '') || '/')
  const screenId = () => page.evaluate(() => document.querySelector('.stage')?.dataset.screen ?? (document.querySelector('.v-landing') ? 'landing' : document.querySelector('.v-login') ? 'login' : null))
  const settle = async () => {
    await page.waitForFunction(() => [...document.images].every((i) => i.complete), { timeout: 8000 }).catch(() => {})
    await sleep(120)
  }
  const open = async (to) => {
    await page.evaluate((t) => { location.hash = t }, to)
    await settle()
  }

  await page.goto(`${BASE}/app.html?clean=1#/`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => { window.__spa = 'alive' }) // маркер: зникне, якщо сторінка перезавантажиться
  const spa = async () => (await page.evaluate(() => window.__spa)) === 'alive'

  // 1) усі екрани відкриваються
  for (const r of ALL) {
    await open(r)
    const id = await screenId()
    const texts = await page.evaluate(() => document.querySelectorAll('.t, .v-landing h1, .v-login h1').length)
    ok(`екран ${r}`, !!id && texts > 0, `${id}, ${texts} текстів`)
  }

  // 2) кожне посилання з даних екранів (hits + тексти з href) веде куди треба — клієнтським переходом
  let linksChecked = 0
  for (const [r, d] of Object.entries(data)) {
    const links = [...d.hits.map((h) => ({ kind: 'hit', label: h.label, href: h.href })), ...d.texts.filter((t) => t.href).map((t) => ({ kind: 'text', label: t.s, href: t.href }))]
    for (const l of links) {
      const isBack = l.href.startsWith('back:')
      const target = '/' + l.href.replace(/^back:/, '').replace(/^#?\/?/, '')
      if (isBack) {
        // екран відкрили за прямим посиланням (свіже завантаження): історії застосунку немає → «назад» веде на запасний шлях
        await page.goto('about:blank')
        await page.goto(`${BASE}/app.html?clean=1#${r}`, { waitUntil: 'networkidle0' })
        await page.evaluate(() => { window.__spa = 'alive' })
        await settle()
      } else {
        await open(r)
      }
      await page.evaluate((l2) => {
        const el = l2.kind === 'hit' ? document.querySelector(`a.hit[aria-label="${l2.label}"]`) : [...document.querySelectorAll('a.t')].find((a) => a.textContent === l2.label)
        el?.click()
      }, l)
      await sleep(80)
      await settle()
      const got = await route()
      linksChecked++
      ok(`${r} → «${l.label}»${isBack ? ' (назад, без історії)' : ''}`, got === target && (await spa()), `${got}${got === target ? '' : ' ≠ ' + target}`)
    }
  }

  // 3) «назад» з історією повертає на попередній екран, а не на запасний
  await open('/dashboard')
  await page.evaluate(() => document.querySelector('a.hit[aria-label="Dreams"]').click())
  await settle()
  await page.evaluate(() => document.querySelector('a.hit[aria-label="The Old House"]').click())
  await settle()
  ok('перехід Dashboard → Dreams → Analysis', (await route()) === '/analysis')
  await page.evaluate(() => document.querySelector('a.hit[aria-label="Back"]').click())
  await settle()
  ok('«назад» в Analysis повертає в Dreams (історія)', (await route()) === '/dreams', await route())
  await page.evaluate(() => document.querySelector('a.hit[aria-label="Back"]').click())
  await settle()
  ok('«назад» у Dreams повертає на Dashboard', (await route()) === '/dashboard', await route())
  await page.goForward()
  await settle()
  ok('кнопка «вперед» браузера (Dashboard → Dreams)', (await route()) === '/dreams', await route())
  await page.goBack()
  await settle()
  ok('кнопка «назад» браузера (Dreams → Dashboard)', (await route()) === '/dashboard', await route())

  // 4) меню сайдбара та крес з брендом
  for (const [label, to] of [['Analytics', '/analysis'], ['Access', '/pricing'], ['Settings', '/settings'], ['Home', '/dashboard'], ['MYSTIQ', '/dashboard']]) {
    await open('/profile')
    await page.evaluate((l) => document.querySelector(`a.hit[aria-label="${l}"]`).click(), label)
    await settle()
    ok(`сайдбар «${label}»`, (await route()) === to, await route())
  }

  // 5) лендінг і логін: вхід у потік
  await open('/')
  const land = await page.evaluate(() => ({ start: document.querySelector('.btn-primary').getAttribute('href'), login: document.querySelector('.btn-ghost').getAttribute('href'), feats: [...document.querySelectorAll('a.feature')].map((a) => a.getAttribute('href')).join() }))
  ok('Landing: посилання', land.start === '#/register' && land.login === '#/login' && land.feats === '#/tarot,#/dreams,#/astrology', JSON.stringify(land))
  for (const [sel, to] of [['.btn-primary', '/register'], ['.btn-ghost', '/login'], ['a.feature:nth-of-type(1)', '/tarot'], ['a.feature:nth-of-type(3)', '/astrology'], ['a.brand', '/']]) {
    await open('/')
    await page.click(sel)
    await settle()
    ok(`Landing: клік ${sel}`, (await route()) === to && (await spa()), await route())
  }
  await open('/login')
  await page.evaluate(() => document.querySelector('.btn-sign').click())
  await settle()
  ok('Login: Sign In → Dashboard', (await route()) === '/dashboard' && (await spa()), await route())
  await open('/login')
  await page.evaluate(() => document.querySelector('.btn-google').click())
  await settle()
  ok('Login: Google → Dashboard', (await route()) === '/dashboard', await route())
  await open('/login')
  await page.evaluate(() => document.querySelector('.foot-link').click())
  await settle()
  ok('Login: Sign Up → Register', (await route()) === '/register', await route())

  // 6) перемикач екранів (демо-панель): список із 12 пунктів, перехід, клавіші
  await page.goto(`${BASE}/app.html#/`, { waitUntil: 'networkidle0' }) // без ?clean — перемикач видно
  await page.evaluate(() => { window.__spa = 'alive' })
  await page.click('.proto-btn')
  const items = await page.$$eval('.proto-panel a', (a) => a.map((x) => x.textContent))
  ok('перемикач: 12 екранів у списку', items.length === 12, items.length)
  await page.evaluate(() => [...document.querySelectorAll('.proto-panel a')].find((a) => a.textContent.includes('Astrology')).click())
  await settle()
  ok('перемикач: перехід на Astrology', (await route()) === '/astrology' && (await spa()), await route())
  await page.keyboard.press(']')
  await settle()
  ok('клавіша ] — наступний екран (Profile)', (await route()) === '/profile', await route())
  await page.keyboard.press('[')
  await settle()
  ok('клавіша [ — попередній екран (Astrology)', (await route()) === '/astrology', await route())
  await page.keyboard.press('g')
  ok('клавіша G відкриває панель', !!(await page.$('.proto-panel')))
  await page.keyboard.press('Escape')
  ok('Esc закриває панель', !(await page.$('.proto-panel')))
  await page.goto(`${BASE}/app.html?clean=1#/dashboard`, { waitUntil: 'networkidle0' })
  ok('?clean ховає перемикач', !(await page.$('.proto-btn')))

  // 7) контроли
  await open('/tarot')
  await page.evaluate(() => document.querySelector('.rad[aria-label="depth"]').click())
  ok('радіо в Tarot Studio', await page.evaluate(() => document.querySelector('.rad[aria-label="depth"]').getAttribute('aria-checked') === 'true'))
  await page.select('.sel select', 'Thoth')
  ok('select колоди', await page.evaluate(() => [...document.querySelectorAll('.t')].some((e) => e.textContent === 'Thoth')))
  await open('/settings')
  await page.evaluate(() => document.querySelector('.tog').click())
  ok('перемикач у Settings', await page.evaluate(() => document.querySelector('.tog').getAttribute('aria-checked') === 'false'))
  await open('/register')
  await page.type('input[name=password]', 'secret')
  const t0 = await page.$eval('input[name=password]', (e) => e.type)
  await page.evaluate(() => document.querySelector('button.hit.act[aria-label="Show password"]').click())
  const t1 = await page.$eval('input[name=password]', (e) => e.type)
  ok('Register: «око» показує пароль', t0 === 'password' && t1 === 'text', `${t0} → ${t1}`)
  await page.evaluate(() => document.querySelector('.chk').click())
  ok('Register: галочка', await page.evaluate(() => document.querySelector('.chk').getAttribute('aria-checked') === 'true'))

  // 8) старі адреси ще працюють
  await page.goto(`${BASE}/landing.html`, { waitUntil: 'networkidle0' })
  ok('landing.html → SPA', (await route()) === '/' && (await screenId()) === 'landing', page.url())
  await page.goto(`${BASE}/login.html`, { waitUntil: 'networkidle0' })
  ok('login.html → SPA', (await route()) === '/login' && (await screenId()) === 'login', page.url())

  // 9) невідомий шлях веде на лендінг
  await page.goto(`${BASE}/app.html?clean=1#/nope`, { waitUntil: 'networkidle0' })
  ok('невідомий шлях → лендінг', (await screenId()) === 'landing')

  ok(`помилок у консолі (перевірено посилань: ${linksChecked})`, errors.length === 0, errors.slice(0, 3).join('; '))
} finally {
  await browser.close()
}
console.table(results)
const bad = results.filter((r) => r.результат !== 'ОК').length
console.log(bad ? `УВАГА: ${bad} перевірок із помилкою з ${results.length}` : `усі ${results.length} перевірок пройдено`)
process.exit(bad ? 1 : 0)
