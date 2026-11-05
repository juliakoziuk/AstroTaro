// Знімки сторінки на типових розмірах екрана (для перевірки адаптивності).
//   node scripts/landing-shots.mjs [WxH[@dpr] ...]   напр.  1920x950 2560x1300@1.25
// Без аргументів — набір «типових моніторів». Результат — OUT (за замовч. node_modules/.cache/landing-shots).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from './landing-diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = process.env.OUT || path.join(root, 'node_modules/.cache/landing-shots')
const URL = process.env.URL || 'http://localhost:5173/app.html?clean=1#/'
fs.mkdirSync(OUT, { recursive: true })

// розміри — це внутрішня область вікна браузера (без панелей), тобто для 1920x1080 екрана ≈ 1920x950
const DEFAULTS = ['1366x650', '1536x730', '1920x950', '2560x1300', '3440x1300', '1280x900', '1024x700', '800x900', '375x812']
const sizes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULTS

const browser = await launch()
try {
  for (const spec of sizes) {
    const [wh, dpr = '1'] = spec.split('@')
    const [w, h] = wh.split('x').map(Number)
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 120)))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)))
    page.on('requestfailed', (r) => errors.push('failed: ' + r.url().split('/').pop().slice(0, 60)))
    await page.setViewport({ width: w, height: h, deviceScaleFactor: Number(dpr), isMobile: w < 500, hasTouch: w < 500 })
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 })
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
    })
    await new Promise((r) => setTimeout(r, 300))
    const info = await page.evaluate(() => {
      const s = document.querySelector('.stage').getBoundingClientRect()
      const a = document.querySelector('.art img, .landing-art')
      return {
        stage: [Math.round(s.left), Math.round(s.top), Math.round(s.width), Math.round(s.height)],
        art: a ? a.currentSrc.split('/').pop().split('?')[0] : 'css-background',
        hScroll: document.documentElement.scrollWidth > innerWidth,
        vScroll: document.documentElement.scrollHeight > innerHeight,
      }
    })
    info.errors = errors.length ? errors : 0
    const file = path.join(OUT, `${w}x${h}${dpr !== '1' ? '@' + dpr : ''}.png`)
    await page.screenshot({ path: file })
    console.log(spec.padEnd(14), JSON.stringify(info))
    await page.close()
  }
} finally {
  await browser.close()
}
