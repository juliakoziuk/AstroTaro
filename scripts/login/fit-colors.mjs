// Дошліфовка кольорів екрана Login за піксельною різницею (розмиття σ = 1, координатний спуск по RGB):
// кольори тексту (старт — виміряні в референсі) і градієнт «повзунка» перемикача теми.
//   node scripts/login/fit-colors.mjs            → node_modules/.cache/login-fit/colors.json
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../landing-diff.mjs'
import { W, H, loadReference } from './diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'node_modules/.cache/login-fit')
const URL = process.env.URL || 'http://localhost:5173/app.html?clean=1#/login'
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

// [назва, селектор, CSS-властивість, зона порівняння, стартовий колір]
const TEXT = [
  ['sbWord', '.sb-word', 'color', [76, 120, 124, 36], '#fae6c2'],
  ['cardWord', '.card-word', 'color', [828, 182, 202, 54], '#fceecc'],
  ['welcome', '.welcome', 'color', [766, 296, 318, 60], '#fefef9'],
  ['subtitle', '.subtitle', 'color', [742, 352, 366, 42], '#b6c3d1'],
  ['navActive', '.nav-item.is-active', 'color', [120, 248, 70, 26], '#fbf6db'],
  ['navLabel', '.nav-item:not(.is-active)', 'color', [120, 320, 100, 300], '#b1bcc8'],
  ['placeholder', '.input', 'color', [730, 432, 180, 130], '#8fa0ae'],
  ['remember', '.remember-text', 'color', [692, 592, 130, 30], '#eef2f7'],
  ['forgot', '.forgot', 'color', [1046, 592, 156, 32], '#decaac'],
  ['signText', '.btn-sign', 'color', [900, 668, 100, 36], '#090910'],
  ['googleText', '.btn-google', 'color', [846, 800, 215, 34], '#fcfeff'],
  ['orText', '.or-text', 'color', [910, 740, 32, 26], '#e6eaf2'],
  ['footText', '.foot-text', 'color', [776, 868, 206, 30], '#a3b0bd'],
  ['footLink', '.foot-link', 'color', [988, 868, 80, 32], '#f0d4a6'],
]
// «повзунок»: лівий, середній і правий кольори горизонтального градієнта й позиція переходу
const KNOB = { zone: [112, 861, 52, 40], stops: [[227, 203, 165], [200, 170, 124], [160, 144, 127]] }

const ref = await loadReference()
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 })
await page.evaluate(async () => {
  await document.fonts.ready
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
})

const refCache = new Map()
async function refZone(zone) {
  const k = zone.join()
  if (!refCache.has(k)) {
    const [x, y, w, h] = zone
    refCache.set(k, await sharp(ref, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x, top: y, width: w, height: h }).blur(1).raw().toBuffer())
  }
  return refCache.get(k)
}
async function score(zone) {
  const [x, y, w, h] = zone
  const png = await page.screenshot({ clip: { x, y, width: w, height: h }, type: 'png', optimizeForSpeed: true })
  const cur = await sharp(png).removeAlpha().blur(1).raw().toBuffer()
  const rf = await refZone(zone)
  let s = 0
  for (let i = 0; i < cur.length; i++) s += Math.abs(cur[i] - rf[i])
  return s / cur.length
}

async function descend(vals, zone, apply, steps = [24, 12, 6, 3, 1]) {
  await apply(vals)
  let best = await score(zone)
  const base = best
  for (const step of steps) {
    for (let sweep = 0; sweep < 12; sweep++) {
      let improved = false
      for (let i = 0; i < vals.length; i++) for (let c = 0; c < 3; c++) for (const dir of [1, -1]) {
        const old = vals[i][c]
        vals[i][c] = Math.max(0, Math.min(255, old + dir * step))
        if (vals[i][c] === old) continue
        await apply(vals)
        const sc = await score(zone)
        if (sc < best - 1e-4) { best = sc; improved = true } else vals[i][c] = old
      }
      if (!improved) break
    }
  }
  await apply(vals)
  return { base, best }
}

const out = { text: {}, knob: null }
for (const [name, sel, prop, zone, start] of TEXT) {
  const vals = [rgb(start)]
  const { base, best } = await descend(vals, zone, async ([c]) => {
    await page.evaluate(({ sel, prop, c }) => document.querySelectorAll(sel).forEach((el) => el.style.setProperty(prop, `rgb(${c.join(',')})`)), { sel, prop, c })
  })
  out.text[name] = hex(vals[0])
  console.log('текст', name.padEnd(12), start, '->', hex(vals[0]), `MAE ${base.toFixed(2)} -> ${best.toFixed(2)}`)
}

{
  const vals = KNOB.stops.map((c) => c.slice())
  const { base, best } = await descend(vals, KNOB.zone, async (v) => {
    await page.evaluate((v) => document.querySelectorAll('.theme-knob').forEach((el) => {
      el.style.background = `linear-gradient(90deg, rgb(${v[0]}) 0%, rgb(${v[1]}) 50%, rgb(${v[2]}) 100%)`
    }), v)
  })
  out.knob = vals.map(hex)
  console.log('повзунок', out.knob.join(' '), `MAE ${base.toFixed(2)} -> ${best.toFixed(2)}`)
}
fs.writeFileSync(path.join(OUT, 'colors.json'), JSON.stringify(out, null, 2))
await browser.close()
