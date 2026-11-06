// Автоматичний підбір шрифту, кегля, трекінгу, інтерліньяжу, позиції й кольору тексту
// за піксельною різницею з референсом (MAE, грубо→точно: розмиття σ 2.5 → 1 → 0).
//   node scripts/fit-text.mjs [h1 lead wordmark brand btn labels]   (без аргументів — усі блоки)
// Результат: node_modules/.cache/landing-fit/results.json і готові значення для landing.css.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch, loadReference, STAGE } from './landing-diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'node_modules/.cache/landing-fit')
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || 'http://localhost:5173/app.html?clean=1#/'

const SERIF = [
  { family: 'Playfair Display', wghts: [400, 500] },
  { family: 'Noto Serif Display', wghts: [400] },
  { family: 'Libre Baskerville', wghts: [400] },
  { family: 'Lora', wghts: [400] },
  { family: 'Cormorant Garamond', wghts: [500, 600] },
  { family: 'EB Garamond', wghts: [400, 500] },
  { family: 'Source Serif 4', wghts: [400] },
  { family: 'PT Serif', wghts: [400] },
  { family: 'Gelasio', wghts: [400] },
  { family: 'Crimson Pro', wghts: [400, 500] },
  { family: 'Spectral', wghts: [400] },
  { family: 'Bodoni Moda', wghts: [400] },
]
// vw — діапазон ваги змінного шрифту (підбирається разом з рештою параметрів); wdth — діапазон ширини
const SANS = [
  { family: 'Roboto', axes: 'wdth,wght@75..100,100..900', wdth: [75, 100], vw: [300, 800], wghts: [500] },
  { family: 'Roboto Condensed', axes: 'wght@100..900', vw: [300, 800], wghts: [500] },
  { family: 'Open Sans', axes: 'wdth,wght@75..100,300..800', wdth: [75, 100], vw: [300, 800], wghts: [500] },
  { family: 'Noto Sans', axes: 'wdth,wght@62.5..100,100..900', wdth: [62.5, 100], vw: [300, 800], wghts: [500] },
  { family: 'Heebo', axes: 'wght@100..900', vw: [300, 800], wghts: [500] },
  { family: 'Arimo', axes: 'wght@400..700', vw: [400, 700], wghts: [500] },
]
const CONDENSED = [
  { family: 'Roboto', axes: 'wdth,wght@75..100,100..900', wdth: [75, 100], vw: [400, 900], wghts: [650] },
  { family: 'Roboto Condensed', axes: 'wght@100..900', vw: [400, 900], wghts: [650] },
  { family: 'Fira Sans Extra Condensed', wghts: [600, 700] },
  { family: 'Archivo Narrow', axes: 'wght@400..700', vw: [400, 700], wghts: [600] },
  { family: 'PT Sans Narrow', wghts: [700] },
]

const BLOCKS = {
  wordmark: {
    sel: '.wordmark', zone: [430, 16, 130, 40], origin: [0, 0], fonts: SERIF, top: 3,
    params: { x: 442, y: 22, fs: 24, ls: 0.8 },
  },
  h1: {
    sel: '.hero h1', zone: [40, 76, 290, 96], origin: [0, 0], fonts: SERIF, top: 3,
    params: { x: 53, y: 80, fs: 38, ls: 0, lh: 41.3 },
  },
  lead: {
    sel: '.lead', zone: [44, 176, 380, 115], origin: [0, 0], fonts: SANS, top: 3, minSigma: 1, target: { line: 'span:first-child', width: 351 },
    params: { x: 53, y: 181, fs: 17, ls: 0, lh: 20.8, wdth: 90 },
  },
  brand: {
    sel: '.brand-name', zone: [60, 16, 80, 32], origin: [30, 16], fonts: SANS, top: 3, minSigma: 1, target: { width: 56 },
    params: { x: 66, y: 24, fs: 14.5, ls: 0, wdth: 100 },
  },
  btn: {
    sel: '.btn', zone: [50, 300, 335, 50], origin: [0, 0], fonts: SANS, top: 2,
    params: { fs: 15, ls: 0, dx: 0, dy: 0, wdth: 90 },
  },
  labels: {
    sel: '.panel', zone: [100, 546, 820, 48], origin: [0, 0], fonts: CONDENSED, top: 3,
    params: { fs: 26, ls: 0, ly: 92, wdth: 75 },
  },
}

for (const b of Object.values(BLOCKS)) b.minSigma ??= 0.7 // не женемося за шумом окремих пікселів

const STEPS = {
  coarse: { sigma: 2.5, steps: { x: 2, y: 2, fs: 1.5, ls: 0.5, lh: 1.5, wdth: 8, wght: 100, dx: 2, dy: 2, ly: 2 } },
  mid: { sigma: 1, steps: { x: 1, y: 1, fs: 0.75, ls: 0.25, lh: 0.75, wdth: 4, wght: 50, dx: 1, dy: 1, ly: 1 } },
  fine: { sigma: 0, steps: { x: 0.5, y: 0.5, fs: 0.3, ls: 0.1, lh: 0.4, wdth: 2, wght: 25, dx: 0.5, dy: 0.5, ly: 0.5 } },
  finer: { sigma: 0, steps: { x: 0.2, y: 0.2, fs: 0.1, ls: 0.05, lh: 0.2, wdth: 1, wght: 10, dx: 0.2, dy: 0.2, ly: 0.2 } },
}
const LIMITS = { fs: [6, 80], ls: [-2, 6] }

const ref = await loadReference()
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: STAGE.width, height: STAGE.height, deviceScaleFactor: 1 })
const failedFonts = []
page.on('response', (r) => {
  if (r.url().includes('fonts.googleapis.com') && r.status() !== 200) failedFonts.push(r.url())
})
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 })
await page.addStyleTag({ content: '.page{padding:0!important}.stage{width:981px!important;max-width:none!important}' })

// ---- шрифти кандидатів ----
const allFonts = new Map()
for (const f of [...SERIF, ...SANS, ...CONDENSED]) {
  const prev = allFonts.get(f.family)
  allFonts.set(f.family, prev ? { ...prev, wghts: [...new Set([...prev.wghts, ...f.wghts])] } : { ...f })
}
for (const f of allFonts.values()) {
  const fam = f.family.replace(/ /g, '+')
  const q = f.axes ? `${fam}:${f.axes}` : `${fam}:wght@${[...f.wghts].sort((a, b) => a - b).join(';')}`
  await page.evaluate((href) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href
    document.head.appendChild(l)
  }, `https://fonts.googleapis.com/css2?family=${q}&display=swap`)
}
await new Promise((r) => setTimeout(r, 2500))
await page.evaluate(async (list) => {
  await Promise.all(list.map(([fam, w]) => document.fonts.load(`${w} 16px "${fam}"`).catch(() => [])))
  await document.fonts.ready
}, [...allFonts.values()].flatMap((f) => f.wghts.map((w) => [f.family, w])))
if (failedFonts.length) console.log('шрифти, що не завантажились:', failedFonts.map((u) => decodeURIComponent(u).match(/family=([^:&]+)/)?.[1]))

// ---- оцінка ----
const refCache = new Map()
async function refZone(zone, sigma) {
  const key = zone.join() + '|' + sigma
  if (!refCache.has(key)) {
    const [x, y, w, h] = zone
    let s = sharp(ref, { raw: { width: STAGE.width, height: STAGE.height, channels: 3 } }).extract({ left: x, top: y, width: w, height: h })
    if (sigma) s = s.blur(sigma)
    refCache.set(key, await s.raw().toBuffer())
  }
  return refCache.get(key)
}
let evals = 0
async function score(zone, sigma) {
  const [x, y, w, h] = zone
  const png = await page.screenshot({ clip: { x, y, width: w, height: h }, type: 'png', optimizeForSpeed: true })
  let s = sharp(png).removeAlpha()
  if (sigma) s = s.blur(sigma)
  const cur = await s.raw().toBuffer()
  const rf = await refZone(zone, sigma)
  let sum = 0
  for (let i = 0; i < cur.length; i++) sum += Math.abs(cur[i] - rf[i])
  evals++
  return sum / cur.length
}

async function apply(block, font, p) {
  await page.evaluate(
    ({ sel, origin, font, p }) => {
      document.querySelectorAll(sel).forEach((el) => {
        const s = el.style
        if (font) {
          s.fontFamily = `"${font.family}", sans-serif`
          s.setProperty('--wght', p.wght ?? font.wght)
        }
        if ('x' in p) s.setProperty('--x', p.x - origin[0])
        if ('y' in p) s.setProperty('--y', p.y - origin[1])
        for (const k of ['fs', 'ls', 'lh', 'wdth', 'dx', 'dy', 'ly']) if (k in p) s.setProperty('--' + k, p[k])
        if (font && !('wdth' in p)) s.setProperty('--wdth', 100)
      })
    },
    { sel: block.sel, origin: block.origin, font, p },
  )
}

const limitOf = (k, font) => (k === 'wdth' ? font.wdth ?? [100, 100] : k === 'wght' ? font.vw ?? [1, 1000] : LIMITS[k] ?? [-1e9, 1e9])

/** Стартові параметри для шрифту: змінна вага/ширина, кегль із ширини першого рядка референсу. */
async function startFor(block, font) {
  const p = { ...block.params }
  if (font.vw) p.wght = font.wght
  if (font.wdth) p.wdth = Math.min(font.wdth[1], Math.max(font.wdth[0], p.wdth ?? 100))
  else delete p.wdth
  if (block.target) {
    await apply(block, font, { ...p, ls: 0 })
    const w = await page.evaluate(({ sel, line }) => {
      const el = document.querySelector(sel)
      const r = document.createRange()
      r.selectNodeContents(line ? el.querySelector(line) : el)
      return r.getBoundingClientRect().width
    }, { sel: block.sel, line: block.target.line })
    p.ls = 0
    p.fs = +((p.fs * block.target.width) / w).toFixed(2)
  }
  return p
}

async function descend(block, font, start, phases) {
  let p = { ...start }
  let best = null
  for (const ph of phases) {
    // minSigma: для тексту з іншою формою літер точний піксельний збіг дає випадковий вибір — міряємо по розмитому
    const sigma = Math.max(STEPS[ph].sigma, block.minSigma ?? 0)
    const { steps } = STEPS[ph]
    await apply(block, font, p)
    best = await score(block.zone, sigma)
    for (let sweep = 0; sweep < 30; sweep++) {
      let improved = false
      for (const k of Object.keys(p)) {
        for (const dir of [1, -1]) {
          for (let n = 0; n < 8; n++) {
            const [lo, hi] = limitOf(k, font)
            const v = Math.min(hi, Math.max(lo, p[k] + dir * steps[k]))
            if (v === p[k]) break
            const q = { ...p, [k]: +v.toFixed(3) }
            await apply(block, font, q)
            const sc = await score(block.zone, sigma)
            if (sc < best - 1e-4) {
              best = sc
              p = q
              improved = true
            } else break
          }
        }
      }
      if (!improved) break
    }
    // перерахунок оцінки в новій сигмі для порівняння між фазами
  }
  await apply(block, font, p)
  best = await score(block.zone, block.minSigma ?? 0)
  return { p, score: best }
}

const want = process.argv.slice(2)
const resultsFile = path.join(OUT, 'results.json')
const results = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf8')) : {}
for (const [name, block] of Object.entries(BLOCKS)) {
  if (want.length && !want.includes(name)) continue
  const t0 = Date.now()
  console.log(`\n== ${name} ==`)
  const only = process.env.FONTS?.split(',') // напр. FONTS="Roboto Condensed,Roboto"
  const cands = block.fonts.filter((f) => !only || only.includes(f.family)).flatMap((f) => f.wghts.map((w) => ({ ...f, wght: w })))
  const screened = []
  for (const font of cands) {
    const r = await descend(block, font, await startFor(block, font), ['coarse'])
    screened.push({ font, ...r })
    console.log(`  скринінг ${font.family} ${font.wght}`.padEnd(40), 'MAE', r.score.toFixed(2), JSON.stringify(r.p))
  }
  screened.sort((a, b) => a.score - b.score)
  const finalists = []
  for (const c of screened.slice(0, block.top)) {
    const r = await descend(block, c.font, c.p, ['mid', 'fine', 'finer'])
    finalists.push({ font: c.font, ...r })
    console.log(`  фінал ${c.font.family} ${c.font.wght}`.padEnd(40), 'MAE', r.score.toFixed(2), JSON.stringify(r.p))
  }
  finalists.sort((a, b) => a.score - b.score)
  const win = finalists[0]
  await apply(block, win.font, win.p)
  results[name] = { family: win.font.family, wght: win.p.wght ?? win.font.wght, wdth: win.p.wdth ?? null, params: win.p, mae: +win.score.toFixed(2), runnersUp: finalists.slice(1).map((f) => ({ family: f.font.family, wght: f.p.wght ?? f.font.wght, mae: +f.score.toFixed(2) })) }
  console.log(`  => ${win.font.family} ${win.font.wght}  MAE ${win.score.toFixed(2)}  (${((Date.now() - t0) / 1000) | 0}s)`)
  // пара «референс / моє» для візуальної перевірки
  const [zx, zy, zw, zh] = block.zone
  const cur = await page.screenshot({ clip: { x: zx, y: zy, width: zw, height: zh }, type: 'png' })
  const ex = { left: zx, top: zy, width: zw, height: zh }
  const refPng = await sharp(ref, { raw: { width: STAGE.width, height: STAGE.height, channels: 3 } }).extract(ex).png().toBuffer()
  const S = 3
  const up = (b) => sharp(b).resize(zw * S, zh * S, { kernel: 'lanczos3' }).png().toBuffer()
  await sharp({ create: { width: zw * S, height: zh * S * 2 + 6, channels: 3, background: '#f00' } })
    .composite([{ input: await up(refPng), top: 0, left: 0 }, { input: await up(cur), top: zh * S + 6, left: 0 }])
    .png()
    .toFile(path.join(OUT, `pair-${name}.png`))
}
fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2))
console.log('\nevals:', evals)
await browser.close()
