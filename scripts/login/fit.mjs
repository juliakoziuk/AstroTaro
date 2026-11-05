// Автопідбір шрифту, кегля, трекінгу й позиції тексту екрана Login за піксельною різницею з перебарвленим референсом
// (координатний спуск: розмиття σ 2.5 → 1 → 0; спершу скринінг шрифтів, потім уточнення трійки найкращих).
//   node scripts/login/fit.mjs [блок ...]        (без аргументів — усі блоки)
//   FONTS="Lato,Mulish" node scripts/login/fit.mjs subtitle      — обмежити кандидатів
// Результат: node_modules/.cache/login-fit/results.json і пари «референс / моє» для перегляду.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../landing-diff.mjs'
import { W, H, loadReference } from './diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'node_modules/.cache/login-fit')
fs.mkdirSync(OUT, { recursive: true })
const URL = process.env.URL || 'http://localhost:5173/app.html?clean=1#/login'

// vw — діапазон ваги змінного шрифту (вага підбирається разом із рештою); static — набір статичних ваг для запиту
const v = (family, axes, vw) => ({ family, wghts: [Math.round((vw[0] + vw[1]) / 2)], axes, vw })
const st = (family, wghts) => ({ family, wghts, static: wghts })
const SERIF = [
  v('Cormorant Garamond', 'wght@300..700', [300, 700]), v('Cormorant', 'wght@300..700', [300, 700]),
  v('EB Garamond', 'wght@400..800', [400, 800]), v('Playfair Display', 'wght@400..900', [400, 900]),
  v('Lora', 'wght@400..700', [400, 700]), v('Crimson Pro', 'wght@200..900', [200, 900]),
  v('Newsreader', 'opsz,wght@6..72,200..800', [200, 800]), v('Source Serif 4', 'opsz,wght@8..60,200..900', [200, 900]),
  v('Gelasio', 'wght@400..700', [400, 700]), v('Libre Baskerville', 'wght@400..700', [400, 700]),
  v('Noto Serif Display', 'wght@100..900', [100, 900]),
  st('Libre Caslon Text', [400, 700]), st('Cardo', [400, 700]), st('Spectral', [300, 400, 500, 600]),
  st('Gilda Display', [400]), st('Prata', [400]),
]
const SERIF_CAPS = [
  ...SERIF, v('Cinzel', 'wght@400..900', [400, 900]), st('Marcellus', [400]), st('Forum', [400]), st('Italiana', [400]),
  st('Bellefair', [400]), st('Philosopher', [400, 700]), st('Cormorant SC', [400, 500, 600, 700]), st('Marcellus SC', [400]),
]
// змінні шрифти: вага підбирається разом із рештою (vw — діапазон)
const SANS = [
  { family: 'Lato', wghts: [400], static: [300, 400, 700] },
  { family: 'Nunito Sans', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Open Sans', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Mulish', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Source Sans 3', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Raleway', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Montserrat', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Jost', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Quicksand', wghts: [400], axes: 'wght@300..700', vw: [300, 700] },
  { family: 'Cabin', wghts: [400], axes: 'wght@400..700', vw: [400, 700] },
  { family: 'Work Sans', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Karla', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Inter', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Noto Sans', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'DM Sans', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Manrope', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  { family: 'Hind', wghts: [400, 500], static: [300, 400, 500, 600] },
  { family: 'PT Sans', wghts: [400], static: [400, 700] },
  { family: 'Fira Sans', wghts: [400], static: [300, 400, 500, 600, 700] },
  { family: 'Libre Franklin', wghts: [400], axes: 'wght@300..800', vw: [300, 800] },
  // найближчі за пропорціями рядків до референсу (scripts/login/rank-fonts.mjs)
  { family: 'Alegreya Sans', wghts: [400], static: [300, 400, 500, 700] },
  { family: 'Encode Sans', wghts: [400], axes: 'wght@100..900', vw: [100, 900] },
  { family: 'Assistant', wghts: [400], axes: 'wght@200..800', vw: [200, 800] },
  { family: 'Catamaran', wghts: [400], axes: 'wght@100..900', vw: [100, 900] },
  { family: 'Signika', wghts: [400], axes: 'wght@300..700', vw: [300, 700] },
  { family: 'Didact Gothic', wghts: [400], static: [400] },
]

// origin — початок координат батьківського елемента в референсі; mode 'x' — підбираємо лише --x (+ --dy)
const BLOCKS = {
  subtitle: { sel: '.subtitle', zone: [742, 352, 366, 42], origin: [600, 62], fonts: SANS, params: { x: 754, y: 358, fs: 23, ls: 0 }, target: { width: 341 } },
  welcome: { sel: '.welcome', zone: [766, 296, 318, 60], origin: [600, 62], fonts: SERIF, params: { x: 775, y: 300, fs: 46, ls: 0 }, target: { width: 293 } },
  cardWord: { sel: '.card-word', zone: [828, 182, 202, 54], origin: [600, 62], fonts: SERIF_CAPS, params: { x: 838, y: 186, fs: 42, ls: 3 }, target: { width: 181 } },
  sbWord: { sel: '.sb-word', zone: [76, 120, 124, 36], origin: [0, 0], fonts: SERIF_CAPS, params: { x: 81, y: 122, fs: 27, ls: 1.6 }, target: { width: 113 } },
  navLabel: { sel: '.nav-label', zone: [118, 245, 100, 380], origin: [46, 0], mode: 'xdy', fonts: SANS, params: { x: 127, dy: 0, fs: 19, ls: 0 }, target: { sel: 'nav a:nth-child(3) .nav-label', width: 76 } },
  placeholder: { sel: '.input', zone: [730, 432, 180, 130], origin: [657, 0], mode: 'xdy', fonts: SANS, params: { x: 742, dy: 0, fs: 23, ls: 0 }, target: { sel: '.field-email .input', width: 141, placeholder: true } },
  remember: { sel: '.remember-text', zone: [692, 592, 130, 30], origin: [600, 62], fonts: SANS, params: { x: 698, y: 596, fs: 19, ls: 0 }, target: { width: 116 } },
  forgot: { sel: '.forgot', zone: [1046, 592, 156, 32], origin: [600, 62], fonts: SANS, params: { x: 1054, y: 596, fs: 19, ls: 0 }, target: { width: 139 } },
  signText: { sel: '.btn-sign .btn-text', zone: [900, 668, 100, 36], origin: [656, 651], fonts: SANS, params: { x: 912, y: 673, fs: 25, ls: 0 }, target: { width: 68 } },
  googleText: { sel: '.btn-google .btn-text', zone: [846, 800, 215, 34], origin: [656, 784], fonts: SANS, params: { x: 853, y: 803, fs: 21, ls: 0 }, target: { width: 195 } },
  orText: { sel: '.or-text', zone: [910, 740, 32, 26], origin: [600, 62], fonts: SANS, params: { x: 916, y: 742, fs: 20, ls: 0 }, target: { width: 20 } },
  footText: { sel: '.foot-text', zone: [776, 868, 206, 30], origin: [600, 62], fonts: SANS, params: { x: 783, y: 872, fs: 19, ls: 0 }, target: { width: 196 } },
  footLink: { sel: '.foot-link', zone: [988, 868, 80, 32], origin: [600, 62], fonts: SANS, params: { x: 993, y: 872, fs: 19, ls: 0 }, target: { width: 68 } },
}
for (const b of Object.values(BLOCKS)) b.minSigma ??= 0.8

const STEPS = {
  coarse: { sigma: 2.5, steps: { x: 2, y: 2, fs: 1.5, ls: 0.5, wght: 100, dy: 2 } },
  mid: { sigma: 1, steps: { x: 1, y: 1, fs: 0.75, ls: 0.25, wght: 50, dy: 1 } },
  fine: { sigma: 0, steps: { x: 0.5, y: 0.5, fs: 0.3, ls: 0.1, wght: 25, dy: 0.5 } },
  finer: { sigma: 0, steps: { x: 0.2, y: 0.2, fs: 0.1, ls: 0.05, wght: 10, dy: 0.2 } },
}
const LIMITS = { fs: [6, 90], ls: [-3, 12] }

const ref = await loadReference()
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 })
const failed = []
page.on('response', (r) => { if (r.url().includes('fonts.googleapis.com') && r.status() !== 200) failed.push(r.url()) })

// ---- шрифти кандидатів ----
const wanted = new Set(Object.values(BLOCKS).flatMap((b) => b.fonts))
const only = process.env.FONTS?.split(',')
const seen = new Map()
for (const font of wanted) {
  if (only && !only.includes(font.family)) continue
  if (!seen.has(font.family)) seen.set(font.family, font)
}
for (const font of seen.values()) {
  const fam = font.family.replace(/ /g, '+')
  const q = font.axes ? `${fam}:${font.axes}` : `${fam}:wght@${[...new Set([...(font.static ?? []), ...font.wghts])].sort((a, b) => a - b).join(';')}`
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
}, [...seen.values()].flatMap((fo) => [...new Set([...(fo.static ?? []), ...fo.wghts])].map((w) => [fo.family, w])))
if (failed.length) console.log('шрифти, що не завантажились:', failed.map((u) => decodeURIComponent(u).match(/family=([^:&]+)/)?.[1]))

// ---- оцінка ----
const refCache = new Map()
async function refZone(zone, sigma) {
  const key = zone.join() + '|' + sigma
  if (!refCache.has(key)) {
    const [x, y, w, h] = zone
    let s = sharp(ref, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x, top: y, width: w, height: h })
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
  await page.evaluate(({ sel, origin, mode, font, p }) => {
    document.querySelectorAll(sel).forEach((el) => {
      const s = el.style
      if (font) {
        s.fontFamily = `"${font.family}", sans-serif`
        s.setProperty('--wght', p.wght ?? font.wght)
      }
      if ('x' in p) s.setProperty('--x', p.x - origin[0])
      if ('y' in p) s.setProperty('--y', p.y - origin[1])
      for (const k of ['fs', 'ls', 'dy']) if (k in p) s.setProperty('--' + k, p[k])
    })
  }, { sel: block.sel, origin: block.origin, mode: block.mode, font, p })
}

const limitOf = (k, font) => (k === 'wght' ? font.vw ?? [1, 1000] : LIMITS[k] ?? [-1e9, 1e9])

async function startFor(block, font) {
  const p = { ...block.params }
  if (font.vw) p.wght = font.wght
  if (block.target) {
    await apply(block, font, { ...p, ls: 0 })
    const w = await page.evaluate(({ sel, placeholder }) => {
      const el = document.querySelector(sel)
      if (placeholder) {
        const c = document.createElement('span')
        const cs = getComputedStyle(el)
        c.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font};letter-spacing:${cs.letterSpacing}`
        c.textContent = el.placeholder
        document.body.appendChild(c)
        const r = c.getBoundingClientRect().width
        c.remove()
        return r
      }
      const r = document.createRange()
      r.selectNodeContents(el)
      return r.getBoundingClientRect().width
    }, { sel: block.target.sel ?? block.sel, placeholder: block.target.placeholder })
    p.ls = 0
    p.fs = +((p.fs * block.target.width) / w).toFixed(2)
  }
  return p
}

async function descend(block, font, start, phases) {
  let p = { ...start }
  let best = null
  for (const ph of phases) {
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
            if (sc < best - 1e-4) { best = sc; p = q; improved = true } else break
          }
        }
      }
      if (!improved) break
    }
  }
  await apply(block, font, p)
  best = await score(block.zone, block.minSigma ?? 0)
  return { p, score: best }
}

const want = process.argv.slice(2)
const resultsFile = path.join(OUT, process.env.RESULTS || 'results.json')
const results = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf8')) : {}
for (const [name, block] of Object.entries(BLOCKS)) {
  if (want.length && !want.includes(name)) continue
  const t0 = Date.now()
  console.log(`\n== ${name} ==`)
  const cands = block.fonts
    .filter((fo) => !only || only.includes(fo.family))
    .flatMap((fo) => fo.wghts.map((w) => ({ ...fo, wght: w })))
  const screened = []
  for (const font of cands) {
    const r = await descend(block, font, await startFor(block, font), ['coarse'])
    screened.push({ font, ...r })
    console.log(`  скринінг ${font.family} ${font.wght}`.padEnd(40), 'MAE', r.score.toFixed(2))
  }
  screened.sort((a, b) => a.score - b.score)
  const finalists = []
  for (const c of screened.slice(0, 3)) {
    const r = await descend(block, c.font, c.p, ['mid', 'fine', 'finer'])
    finalists.push({ font: c.font, ...r })
    console.log(`  фінал ${c.font.family} ${c.font.wght}`.padEnd(40), 'MAE', r.score.toFixed(2), JSON.stringify(r.p))
  }
  finalists.sort((a, b) => a.score - b.score)
  const win = finalists[0]
  await apply(block, win.font, win.p)
  results[name] = { family: win.font.family, wght: win.p.wght ?? win.font.wght, params: win.p, mae: +win.score.toFixed(2), runnersUp: finalists.slice(1).map((x) => ({ family: x.font.family, wght: x.p.wght ?? x.font.wght, mae: +x.score.toFixed(2), params: x.p })) }
  console.log(`  => ${win.font.family} ${results[name].wght}  MAE ${win.score.toFixed(2)}  (${((Date.now() - t0) / 1000) | 0}s)`)
  const [zx, zy, zw, zh] = block.zone
  const cur = await page.screenshot({ clip: { x: zx, y: zy, width: zw, height: zh }, type: 'png' })
  const refPng = await sharp(ref, { raw: { width: W, height: H, channels: 3 } }).extract({ left: zx, top: zy, width: zw, height: zh }).png().toBuffer()
  const S = Math.max(1, Math.min(3, Math.floor(1100 / zw)))
  const up = (b) => sharp(b).resize(zw * S, zh * S, { kernel: 'lanczos3' }).png().toBuffer()
  await sharp({ create: { width: zw * S, height: zh * S * 2 + 6, channels: 3, background: '#f00' } })
    .composite([{ input: await up(refPng), top: 0, left: 0 }, { input: await up(cur), top: zh * S + 6, left: 0 }])
    .png()
    .toFile(path.join(OUT, `pair-${name}.png`))
}
fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2))
console.log('\nevals:', evals)
await browser.close()
