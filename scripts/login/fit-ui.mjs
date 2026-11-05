// Кольори тексту (з референсу: яскраві/темні штрихи) і підбір кольорів/градієнтів елементів Login за піксельною різницею.
//   node scripts/login/fit-ui.mjs [text boxes]
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../landing-diff.mjs'
import { W, H, loadReference, GRADED } from './diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'node_modules/.cache/login-fit')
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || 'http://localhost:5173/app.html?clean=1#/login'
const want = process.argv.slice(2)

const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

// ---------- 1. кольори тексту з референсу ----------
const TEXT = {
  sbWord: { sel: '.sb-word', zone: [76, 120, 124, 36] },
  cardWord: { sel: '.card-word', zone: [828, 182, 202, 54] },
  welcome: { sel: '.welcome', zone: [766, 296, 318, 60] },
  subtitle: { sel: '.subtitle', zone: [742, 352, 366, 42] },
  navActive: { sel: '.nav-item.is-active', zone: [120, 248, 70, 26] },
  navLabel: { sel: '.nav-item:not(.is-active)', zone: [120, 320, 100, 300] },
  placeholder: { sel: '.input', zone: [730, 432, 180, 130] },
  remember: { sel: '.remember-text', zone: [692, 592, 130, 30] },
  forgot: { sel: '.forgot', zone: [1046, 592, 156, 32] },
  signText: { sel: '.btn-sign', zone: [900, 668, 100, 36], dark: true },
  googleText: { sel: '.btn-google', zone: [846, 800, 215, 34] },
  orText: { sel: '.or-text', zone: [910, 740, 32, 26] },
  footText: { sel: '.foot-text', zone: [776, 868, 206, 30] },
  footLink: { sel: '.foot-link', zone: [988, 868, 80, 32] },
}
if (!want.length || want.includes('text')) {
  const rgb = await sharp(GRADED).removeAlpha().raw().toBuffer()
  const lum = await sharp(GRADED).greyscale().raw().toBuffer()
  const med = await sharp(GRADED).greyscale().median(25).raw().toBuffer()
  const res = {}
  for (const [name, { zone, dark }] of Object.entries(TEXT)) {
    const [x, y, w, h] = zone
    const px = []
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const p = j * W + i
      if (Math.abs(lum[p] - med[p]) > 18) px.push([lum[p], rgb[p * 3], rgb[p * 3 + 1], rgb[p * 3 + 2]])
    }
    px.sort((a, b) => (dark ? a[0] - b[0] : b[0] - a[0]))
    const n = Math.max(6, Math.round(px.length * (dark ? 0.2 : 0.1)))
    const c = [1, 2, 3].map((k) => px.slice(0, n).reduce((s, p) => s + p[k], 0) / n)
    res[name] = hex(c)
    console.log('текст', name.padEnd(12), hex(c), `(${px.length} px)`)
  }
  fs.writeFileSync(path.join(OUT, 'text-colors.json'), JSON.stringify(res, null, 2))
}

// ---------- 2. елементи: спуск за MAE ----------
if (want.length && !want.includes('boxes')) process.exit(0)
const ref = await loadReference()
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 })
await page.evaluate(async () => {
  await document.fonts.ready
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
})

// params: масив [назва, початкове rgb|число, крок(и)]; css(vals) -> {властивість: значення}
const BOXES = {
  navPill: {
    sel: '.nav-pill', zone: [36, 216, 204, 86],
    init: { border: [185, 149, 100], a: [15, 31, 53], b: [21, 36, 58], c: [16, 30, 51] },
    css: (v) => ({ 'border-color': `rgb(${v.border})`, background: `linear-gradient(90deg, rgb(${v.a}), rgb(${v.b}) 50%, rgb(${v.c}))` }),
  },
  theme: {
    sel: '.theme', zone: [56, 850, 164, 60],
    init: { border: [111, 124, 141], fill: [11, 24, 41], k1: [227, 203, 165], k2: [200, 170, 124] },
    css: (v) => ({ 'border-color': `rgb(${v.border})`, background: `rgb(${v.fill})` }),
    extra: (v) => ({ '.theme-knob': { background: `linear-gradient(180deg, rgb(${v.k1}), rgb(${v.k2}))` } }),
  },
  fieldEmail: {
    sel: '.field-email', zone: [650, 412, 550, 84],
    init: { line: [95, 112, 130] },
    css: (v) => ({ 'box-shadow': `0 0 0 calc(var(--u) * 1) #051020, inset 0 0 0 calc(var(--u) * 2) rgb(${v.line}), inset 0 0 0 calc(var(--u) * 3) #051020`, border: '0' }),
  },
  fieldPass: {
    sel: '.field-pass', zone: [650, 497, 550, 84],
    init: { line: [95, 112, 130] },
    css: (v) => ({ 'box-shadow': `0 0 0 calc(var(--u) * 1) #051020, inset 0 0 0 calc(var(--u) * 2) rgb(${v.line}), inset 0 0 0 calc(var(--u) * 3) #051020`, border: '0' }),
  },
  checkbox: {
    sel: '.remember .box', zone: [652, 588, 40, 40],
    init: { border: [200, 198, 186], fill: [13, 29, 44] },
    css: (v) => ({ 'border-color': `rgb(${v.border})`, background: `rgb(${v.fill})` }),
  },
  signBtn: {
    sel: '.btn-sign', zone: [650, 646, 550, 76],
    init: { s0: [189, 147, 97], s1: [200, 154, 103], s2: [226, 180, 120], s3: [200, 160, 108], s4: [134, 111, 89] },
    css: (v) => ({ background: `linear-gradient(180deg, #ffffff1c, transparent 45%, #00000012), linear-gradient(90deg, rgb(${v.s0}), rgb(${v.s1}) 25%, rgb(${v.s2}) 50%, rgb(${v.s3}) 75%, rgb(${v.s4}))` }),
  },
  googleBtn: {
    sel: '.btn-google', zone: [650, 778, 550, 78],
    init: { border: [190, 168, 140], fill: [7, 21, 34] },
    css: (v) => ({ 'box-shadow': `0 0 0 calc(var(--u) * 1) #040a10, inset 0 0 0 calc(var(--u) * 1.6) rgb(${v.border}), inset 0 0 0 calc(var(--u) * 2.6) #0b0d12`, border: '0', background: `rgb(${v.fill})` }),
  },
  orLines: {
    sel: '.or-line-l', zone: [655, 744, 245, 16],
    init: { far: [58, 70, 82], near: [150, 155, 162] },
    css: (v) => ({ background: `linear-gradient(90deg, rgb(${v.far}), rgb(${v.near}))` }),
    extra: (v) => ({ '.or-line-r': { background: `linear-gradient(90deg, rgb(${v.near}), rgb(${v.far}))` } }),
  },
}

const refCache = new Map()
async function refZone(zone) {
  const k = zone.join()
  if (!refCache.has(k)) {
    const [x, y, w, h] = zone
    refCache.set(k, await sharp(ref, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x, top: y, width: w, height: h }).raw().toBuffer())
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
const applyCss = (sel, css, extra) =>
  page.evaluate(({ sel, css, extra }) => {
    document.querySelectorAll(sel).forEach((el) => { for (const [k, v] of Object.entries(css)) el.style.setProperty(k, v) })
    for (const [s2, props] of Object.entries(extra ?? {})) document.querySelectorAll(s2).forEach((el) => { for (const [k, v] of Object.entries(props)) el.style.setProperty(k, v) })
  }, { sel, css, extra })

const out = {}
if (!want.length || want.includes('boxes')) {
  for (const [name, box] of Object.entries(BOXES)) {
    const v = JSON.parse(JSON.stringify(box.init))
    const set = () => applyCss(box.sel, box.css(v), box.extra?.(v))
    await set()
    let best = await score(box.zone)
    const base = best
    for (const step of [32, 16, 8, 4, 2, 1]) {
      for (let sweep = 0; sweep < 10; sweep++) {
        let improved = false
        for (const key of Object.keys(v)) {
          for (let c = 0; c < 3; c++) {
            for (const dir of [1, -1]) {
              const old = v[key][c]
              v[key][c] = Math.max(0, Math.min(255, old + dir * step))
              if (v[key][c] === old) continue
              await set()
              const sc = await score(box.zone)
              if (sc < best - 1e-4) { best = sc; improved = true } else v[key][c] = old
            }
          }
        }
        if (!improved) break
      }
    }
    await set()
    out[name] = Object.fromEntries(Object.entries(v).map(([k, c]) => [k, hex(c)]))
    out[name].mae = +best.toFixed(2)
    console.log('box', name.padEnd(11), `MAE ${base.toFixed(2)} -> ${best.toFixed(2)}`, JSON.stringify(out[name]))
  }
  fs.writeFileSync(path.join(OUT, 'boxes.json'), JSON.stringify(out, null, 2))
}
await browser.close()
