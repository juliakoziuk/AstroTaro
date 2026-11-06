// Фінальна «шліфовка» тексту за SSIM (структурна схожість) — підбирає вагу змінного шрифту
// (або яскравість кольору для шрифтів зі статичною вагою) у кожному текстовому блоці.
//   node scripts/fit-polish.mjs
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch, loadReference, STAGE } from './landing-diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'node_modules/.cache/landing-fit')
const URL = process.env.URL || 'http://localhost:5173/app.html?clean=1#/'

// [назва, селектор, зона, ручка]: ручка 'wght' (змінний шрифт) або 'k' (множник яскравості кольору)
const BLOCKS = [
  ['lead', '.lead', [44, 176, 380, 115], { wght: [350, 400, 450, 500, 550, 600, 650, 700] }],
  ['brand', '.brand-name', [60, 16, 80, 32], { wght: [300, 350, 400, 450, 500, 550, 600] }],
  ['btn', '.btn', [50, 300, 335, 50], { wght: [300, 350, 400, 450, 500, 550, 600] }],
  ['labels', '.panel', [100, 546, 820, 48], { wght: [400, 450, 500, 550, 600, 650, 700, 750] }],
  ['h1', '.hero h1', [40, 76, 290, 96], { k: [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1] }],
  ['wordmark', '.wordmark', [430, 16, 130, 40], { k: [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1] }],
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

function ssimGray(a, b, w, h) {
  const C1 = (0.01 * 255) ** 2
  const C2 = (0.03 * 255) ** 2
  let sum = 0
  let n = 0
  for (let y = 0; y + 8 <= h; y += 2) for (let x = 0; x + 8 <= w; x += 2) {
    let ma = 0, mb = 0
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { ma += a[(y + j) * w + x + i]; mb += b[(y + j) * w + x + i] }
    ma /= 64; mb /= 64
    let va = 0, vb = 0, cv = 0
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const da = a[(y + j) * w + x + i] - ma
      const db = b[(y + j) * w + x + i] - mb
      va += da * da; vb += db * db; cv += da * db
    }
    va /= 63; vb /= 63; cv /= 63
    sum += ((2 * ma * mb + C1) * (2 * cv + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))
    n++
  }
  return sum / n
}
const grayOf = (rgb) => {
  const g = new Float32Array(rgb.length / 3)
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2]
  return g
}
async function zoneSsim(zone) {
  const [x, y, w, h] = zone
  const png = await page.screenshot({ clip: { x, y, width: w, height: h }, type: 'png', optimizeForSpeed: true })
  const cur = await sharp(png).removeAlpha().raw().toBuffer()
  const rf = await sharp(ref, { raw: { width: STAGE.width, height: STAGE.height, channels: 3 } }).extract({ left: x, top: y, width: w, height: h }).raw().toBuffer()
  return ssimGray(grayOf(rf), grayOf(cur), w, h)
}

const out = {}
const BLUR = process.env.KNOB === 'blur'
const HALO = process.env.KNOB === 'halo'
for (let [name, sel, zone, knob] of BLOCKS) {
  if (BLUR) knob = { blur: [0, 0.2, 0.3, 0.4, 0.5, 0.65, 0.8] }
  if (HALO) knob = { halo: ['none', '0 0 1px #000', '0 0 2px #000', '0 1px 2px #000', '0 0 3px rgba(0,0,0,.8)', '0 1px 3px #000', '0 2px 4px #000', '0 2px 6px #000'] }
  const base = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    const cs = getComputedStyle(el)
    return { wght: cs.fontWeight, color: cs.color }
  }, sel)
  const rgb = base.color.match(/[\d.]+/g).slice(0, 3).map(Number)
  const scan = []
  const [kind, values] = Object.entries(knob)[0]
  for (const v of values) {
    await page.evaluate(({ sel, kind, v, rgb }) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (kind === 'wght') el.style.setProperty('--wght', v)
        else if (kind === 'blur') el.style.filter = v ? `blur(${v}px)` : ''
        else if (kind === 'halo') el.style.textShadow = v
        else el.style.color = `rgb(${rgb.map((c) => Math.min(255, Math.round(c * v))).join(',')})`
      })
    }, { sel, kind, v, rgb })
    scan.push([v, await zoneSsim(zone)])
  }
  scan.sort((a, b) => b[1] - a[1])
  const [bestV, bestS] = scan[0]
  await page.evaluate(({ sel, kind, v, rgb }) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (kind === 'wght') el.style.setProperty('--wght', v)
      else if (kind === 'blur') el.style.filter = v ? `blur(${v}px)` : ''
        else if (kind === 'halo') el.style.textShadow = v
      else el.style.color = `rgb(${rgb.map((c) => Math.min(255, Math.round(c * v))).join(',')})`
    })
  }, { sel, kind, v: bestV, rgb })
  const color = kind === 'k' ? '#' + rgb.map((c) => Math.min(255, Math.round(c * bestV)).toString(16).padStart(2, '0')).join('') : undefined
  out[name] = { [kind]: bestV, ssim: +bestS.toFixed(3), color, scan: scan.map(([v, s]) => `${v}:${s.toFixed(3)}`).join(' ') }
  console.log(name.padEnd(9), kind, String(bestV).padEnd(5), 'SSIM', bestS.toFixed(3), color ?? '', '|', out[name].scan)
}
fs.writeFileSync(path.join(OUT, 'polish.json'), JSON.stringify(out, null, 2))
await browser.close()
