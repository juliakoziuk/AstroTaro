// Піксельне порівняння лендінгу з референсом.
//   node scripts/landing-diff.mjs                  -> метрики для поточного режиму
//   ART=vector node scripts/landing-diff.mjs       -> режим вектора (?art=vector)
// Результати (current.png, diff.png, reference.png) лягають у OUT (за замовч. node_modules/.cache/landing-diff).
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'
import pixelmatch from 'pixelmatch'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const STAGE = { left: 22, top: 44, width: 981, height: 639 }
export const CHROME =
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find((p) => fs.existsSync(p)) ?? process.env.CHROME

// Зони для звіту (координати в сцені 981x639). Крайові 6 px не міряємо: у референсі там рамка-«картка»,
// а на сторінці її прибрано (повноекранний режим).
export const REGIONS = {
  header: [6, 6, 969, 64],
  heroText: [40, 70, 420, 330],
  buttons: [40, 296, 400, 60],
  artRight: [560, 70, 421, 365],
  panel: [40, 438, 901, 175],
  full: [6, 6, 969, 627],
}

export async function loadReference() {
  const { data } = await sharp(path.join(root, '../assets/img.png'))
    .extract(STAGE)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return data
}

export async function launch() {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'],
  })
}

/** Рендерить сцену рівно 981x639 (вікно такого розміру = референсна пропорція) і повертає RGB-буфер. */
export async function shoot(page, url, { stageCss = '' } = {}) {
  await page.setViewport({ width: STAGE.width, height: STAGE.height, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 })
  if (stageCss) await page.addStyleTag({ content: stageCss })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
  })
  await new Promise((r) => setTimeout(r, 400))
  const el = await page.$('.stage')
  const png = await el.screenshot({ type: 'png' })
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  if (info.width !== STAGE.width || info.height !== STAGE.height) {
    throw new Error(`stage is ${info.width}x${info.height}, expected ${STAGE.width}x${STAGE.height}`)
  }
  return { data, png }
}

const gray = (rgb) => {
  const g = new Float32Array(rgb.length / 3)
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2]
  return g
}

/** SSIM (сіра шкала, вікна 8x8, крок 4) усередині прямокутника. */
export function ssim(a, b, [rx, ry, rw, rh]) {
  const ga = gray(a)
  const gb = gray(b)
  const W = STAGE.width
  const C1 = (0.01 * 255) ** 2
  const C2 = (0.03 * 255) ** 2
  let sum = 0
  let n = 0
  for (let y = ry; y + 8 <= ry + rh; y += 4) {
    for (let x = rx; x + 8 <= rx + rw; x += 4) {
      let ma = 0
      let mb = 0
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        ma += ga[(y + j) * W + x + i]
        mb += gb[(y + j) * W + x + i]
      }
      ma /= 64
      mb /= 64
      let va = 0
      let vb = 0
      let cov = 0
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const da = ga[(y + j) * W + x + i] - ma
        const db = gb[(y + j) * W + x + i] - mb
        va += da * da
        vb += db * db
        cov += da * db
      }
      va /= 63
      vb /= 63
      cov /= 63
      sum += ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))
      n++
    }
  }
  return sum / n
}

export function mae(a, b, [rx, ry, rw, rh]) {
  const W = STAGE.width
  let s = 0
  for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
    const p = (y * W + x) * 3
    s += Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2])
  }
  return s / (rw * rh * 3)
}

export function report(ref, cur) {
  const out = {}
  for (const [name, rect] of Object.entries(REGIONS)) {
    out[name] = { mae: +mae(ref, cur, rect).toFixed(2), ssim: +ssim(ref, cur, rect).toFixed(3) }
  }
  return out
}

export async function writeDiff(dir, ref, cur) {
  fs.mkdirSync(dir, { recursive: true })
  const { width: w, height: h } = STAGE
  const rgba = (rgb) => {
    const o = Buffer.alloc(w * h * 4)
    for (let i = 0; i < w * h; i++) {
      o[i * 4] = rgb[i * 3]
      o[i * 4 + 1] = rgb[i * 3 + 1]
      o[i * 4 + 2] = rgb[i * 3 + 2]
      o[i * 4 + 3] = 255
    }
    return o
  }
  const A = rgba(ref)
  const B = rgba(cur)
  const D = Buffer.alloc(w * h * 4)
  const bad = pixelmatch(A, B, D, w, h, { threshold: 0.15, includeAA: true })
  // посилена абсолютна різниця — краще видно, де «пливе»
  const amp = Buffer.alloc(w * h * 3)
  for (let i = 0; i < w * h * 3; i++) amp[i] = Math.min(255, Math.abs(ref[i] - cur[i]) * 4)
  await sharp(A, { raw: { width: w, height: h, channels: 4 } }).png().toFile(path.join(dir, 'reference.png'))
  await sharp(B, { raw: { width: w, height: h, channels: 4 } }).png().toFile(path.join(dir, 'current.png'))
  await sharp(amp, { raw: { width: w, height: h, channels: 3 } }).png().toFile(path.join(dir, 'diff.png'))
  return { mismatchPct: +((bad / (w * h)) * 100).toFixed(2) }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // лендінг живе в SPA (app.html, маршрут #/); ?clean ховає перемикач екранів, ?art=vector — векторний режим сцени
  const url = process.env.URL || `http://localhost:5173/app.html?clean=1${process.env.ART ? `&art=${process.env.ART}` : ''}#/`
  const dir = process.env.OUT || path.join(root, 'node_modules/.cache/landing-diff')
  const browser = await launch()
  try {
    const page = await browser.newPage()
    const [ref, { data: cur }] = [await loadReference(), await shoot(page, url)]
    const extra = await writeDiff(dir, ref, cur)
    console.log(url)
    console.table(report(ref, cur))
    console.log(extra, '->', dir)
  } finally {
    await browser.close()
  }
}
