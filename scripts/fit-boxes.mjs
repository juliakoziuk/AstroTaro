// Підбір кольорів і геометрії (кнопки) за піксельною різницею з референсом — після fit-text.mjs.
//   node scripts/fit-boxes.mjs [colors boxes]   (за замовч. обидва етапи)
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch, loadReference, STAGE } from './landing-diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'node_modules/.cache/landing-fit')
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || 'http://localhost:5173/app.html?clean=1#/'

// колірні властивості, що підбираються: [назва, селектор, CSS-властивість, зона порівняння]
const COLORS = [
  ['h1', '.hero h1', 'color', [40, 76, 290, 96]],
  ['wordmark', '.wordmark', 'color', [430, 16, 130, 40]],
  ['lead', '.lead', 'color', [44, 176, 380, 115]],
  ['brand', '.brand-name', 'color', [60, 16, 80, 32]],
  ['labels', '.feature', 'color', [100, 546, 820, 48]],
  ['btnPrimaryBg', '.btn-primary', 'background-color', [48, 300, 170, 50]],
  ['btnPrimaryText', '.btn-primary', 'color', [48, 300, 170, 50]],
  ['btnGhostBorder', '.btn-ghost', 'border-color', [212, 300, 175, 50]],
  ['btnGhostText', '.btn-ghost', 'color', [212, 300, 175, 50]],
]
// геометрія кнопок у пікселях референсу
const BOXES = [
  ['btnPrimary', '.btn-primary', [48, 300, 170, 50], { left: 55, top: 307, width: 152, height: 35 }],
  ['btnGhost', '.btn-ghost', [212, 300, 175, 50], { left: 220, top: 307, width: 156, height: 35 }],
]

const ref = await loadReference()
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: STAGE.width, height: STAGE.height, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 })
await page.addStyleTag({ content: '.page{padding:0!important}.stage{width:981px!important;max-width:none!important}' })
await page.evaluate(async () => {
  await document.fonts.ready
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
})

const refCache = new Map()
async function refZone(zone) {
  const k = zone.join()
  if (!refCache.has(k)) {
    const [x, y, w, h] = zone
    refCache.set(k, await sharp(ref, { raw: { width: STAGE.width, height: STAGE.height, channels: 3 } }).extract({ left: x, top: y, width: w, height: h }).raw().toBuffer())
  }
  return refCache.get(k)
}
async function score(zone) {
  const [x, y, w, h] = zone
  const png = await page.screenshot({ clip: { x, y, width: w, height: h }, type: 'png', optimizeForSpeed: true })
  const cur = await sharp(png).removeAlpha().raw().toBuffer()
  const rf = await refZone(zone)
  let s = 0
  for (let i = 0; i < cur.length; i++) s += Math.abs(cur[i] - rf[i])
  return s / cur.length
}
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const out = { colors: {}, boxes: {} }
const want = process.argv.slice(2)

// ---------- геометрія ----------
if (!want.length || want.includes('boxes')) {
  for (const [name, sel, zone, start] of BOXES) {
    const p = { ...start, bw: 1.4 }
    const apply = () =>
      page.evaluate(({ sel, p }) => {
        const el = document.querySelector(sel)
        el.style.left = `calc(var(--u) * ${p.left})`
        el.style.top = `calc(var(--u) * ${p.top})`
        el.style.width = `calc(var(--u) * ${p.width})`
        el.style.height = `calc(var(--u) * ${p.height})`
        if (el.classList.contains('btn-ghost')) el.style.borderWidth = `calc(var(--u) * ${p.bw})`
      }, { sel, p })
    await apply()
    let best = await score(zone)
    for (const step of [2, 1, 0.5, 0.25]) {
      for (let sweep = 0; sweep < 12; sweep++) {
        let improved = false
        for (const k of Object.keys(p)) {
          if (k === 'bw' && name !== 'btnGhost') continue
          const st = k === 'bw' ? step / 4 : step
          for (const dir of [1, -1]) {
            const old = p[k]
            p[k] = +(old + dir * st).toFixed(3)
            await apply()
            const sc = await score(zone)
            if (sc < best - 1e-4) { best = sc; improved = true } else p[k] = old
          }
        }
        if (!improved) break
      }
    }
    await apply()
    out.boxes[name] = { ...p, mae: +best.toFixed(2) }
    console.log('box', name, JSON.stringify(out.boxes[name]))
  }
}

// ---------- кольори ----------
if (!want.length || want.includes('colors')) {
  for (const [name, sel, prop, zone] of COLORS) {
    const start = await page.evaluate(({ sel, prop }) => {
      const m = getComputedStyle(document.querySelector(sel))[prop.replace(/-(\w)/g, (_, c) => c.toUpperCase())].match(/[\d.]+/g)
      return m.slice(0, 3).map(Number)
    }, { sel, prop })
    let c = [...start]
    const apply = (v) => page.evaluate(({ sel, prop, v }) => document.querySelectorAll(sel).forEach((el) => el.style.setProperty(prop, `rgb(${v.join(',')})`)), { sel, prop, v })
    await apply(c)
    let best = await score(zone)
    for (const step of [24, 12, 6, 3, 1]) {
      for (let sweep = 0; sweep < 15; sweep++) {
        let improved = false
        for (let k = 0; k < 3; k++) {
          for (const dir of [1, -1]) {
            const old = c[k]
            c[k] = Math.max(0, Math.min(255, old + dir * step))
            if (c[k] === old) continue
            await apply(c)
            const sc = await score(zone)
            if (sc < best - 1e-4) { best = sc; improved = true } else c[k] = old
          }
        }
        if (!improved) break
      }
    }
    await apply(c)
    out.colors[name] = { color: hex(c), from: hex(start), mae: +best.toFixed(2) }
    console.log('colour', name.padEnd(16), hex(start), '->', hex(c), 'MAE', best.toFixed(2))
  }
}
fs.writeFileSync(path.join(OUT, 'boxes-colors.json'), JSON.stringify(out, null, 2))
await browser.close()
