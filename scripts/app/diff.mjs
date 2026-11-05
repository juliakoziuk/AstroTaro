// Піксельне порівняння екранів застосунку з макетами (після перебарвлення під синій Landing).
//   node scripts/app/diff.mjs [id ...]      (потрібен запущений npm run dev; за замовч. усі екрани з даними)
// Результати: node_modules/.cache/app-diff/<id>/{reference,current,diff}.png і зведена таблиця.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { SCREENS, W, H, root } from './common.mjs'
import { loadGraded } from './prepare.mjs'
import { launch } from '../landing-diff.mjs'
import { report, writeDiff, ssim } from '../lib/metrics.mjs'
import { googleFontsHref } from './fontpage.mjs'

const BASE = process.env.BASE || 'http://localhost:5173/app.html'

/** Рендерить екрани у вікні 1536x1024 і порівнює з макетами; повертає рядки таблиці. */
export async function runDiff(ids = [], { quiet = false } = {}) {
  const have = SCREENS.filter((s) => fs.existsSync(path.join(root, `src/app/data/${s.id}.json`)))
  const targets = ids.length ? have.filter((s) => ids.includes(s.id)) : have
  const fonts = JSON.parse(fs.readFileSync(path.join(root, 'scripts/app/fonts.json'), 'utf8'))
  const href = await googleFontsHref(fonts)
  const browser = await launch()
  const rows = []
  try {
    for (const sc of targets) {
      const { rgb } = await loadGraded(sc.id)
      const data = JSON.parse(fs.readFileSync(path.join(root, `src/app/data/${sc.id}.json`), 'utf8'))
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 100)))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 100)))
      // шрифти з fonts.json підключаємо самі: app.html міг ще не знати про щойно обрані гарнітури
      await page.evaluateOnNewDocument((href) => {
        document.addEventListener('DOMContentLoaded', () => {
          const l = document.createElement('link')
          l.rel = 'stylesheet'
          l.href = href
          document.head.appendChild(l)
        })
      }, href)
      await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
      await page.goto(`${BASE}?clean=1&t=${Date.now()}#${sc.route}`, { waitUntil: 'networkidle0', timeout: 120000 })
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
      })
      await new Promise((r) => setTimeout(r, 500))
      const cur = await sharp(await page.screenshot({ type: 'png' })).removeAlpha().raw().toBuffer()
      await page.close()
      const dir = path.join(root, `node_modules/.cache/app-diff/${sc.id}`)
      const extra = await writeDiff(dir, rgb, cur, W, H)
      const zones = report(rgb, cur, W, { full: [0, 0, W, H], sidebar: [0, 0, 242, H], content: [242, 0, W - 242, H] })
      // схожість у зонах тексту (усереднена за рамками рядків)
      const boxes = [...data.texts, ...data.selects.map((s) => s.t), ...data.inputs.map((s) => s.t)]
      let sum = 0
      let n = 0
      for (const t of boxes) {
        const x = Math.max(0, Math.round(t.x - 6))
        const y = Math.max(0, Math.round(t.y))
        const w = Math.min(W - x, Math.max(16, Math.round(t.s.length * t.fs * 0.55) + 12))
        const h = Math.min(H - y, Math.max(16, Math.round(t.lh)))
        sum += ssim(rgb, cur, W, [x, y, w, h], 2)
        n++
      }
      rows.push({ screen: sc.id, full: zones.full.ssim, sidebar: zones.sidebar.ssim, content: zones.content.ssim, 'рядки': +(sum / Math.max(1, n)).toFixed(3), mae: zones.full.mae, mismatch: extra.mismatchPct + '%', errors: errors.length ? errors.join('; ') : 0 })
    }
  } finally {
    await browser.close()
  }
  if (!quiet) console.table(rows)
  return rows
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDiff(process.argv.slice(2).filter((x) => !x.startsWith('--')))
}
