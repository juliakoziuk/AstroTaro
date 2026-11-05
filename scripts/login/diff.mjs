// Піксельне порівняння екрана Login з референсом (після підгонки синього під Landing).
//   node scripts/login/diff.mjs            (потрібні npm run dev і зібрані матеріали: node scripts/build-login.mjs)
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { launch } from '../landing-diff.mjs'
import { report, writeDiff } from '../lib/metrics.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const W = 1535
export const H = 1024
export const GRADED = path.join(root, 'node_modules/.cache/login-build/G-graded.png')
export const REGIONS = {
  sidebar: [0, 0, 242, 1024],
  cardTop: [603, 40, 642, 330],
  inputs: [650, 410, 556, 175],
  buttons: [650, 585, 556, 275],
  footer: [700, 860, 450, 50],
  artLeft: [242, 0, 361, 1024],
  artRight: [1246, 0, 289, 1024],
  full: [0, 0, 1535, 1024],
}

export const loadReference = async () => sharp(GRADED).removeAlpha().raw().toBuffer()

export async function shoot(page, url) {
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
  })
  await new Promise((r) => setTimeout(r, 400))
  const png = await page.screenshot({ type: 'png' })
  return sharp(png).removeAlpha().raw().toBuffer()
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = process.env.URL || 'http://localhost:5173/app.html?clean=1#/login'
  const dir = process.env.OUT || path.join(root, 'node_modules/.cache/login-diff')
  const browser = await launch()
  try {
    const page = await browser.newPage()
    const ref = await loadReference()
    const cur = await shoot(page, url)
    const extra = await writeDiff(dir, ref, cur, W, H)
    console.table(report(ref, cur, W, REGIONS))
    console.log(extra, '->', dir)
  } finally {
    await browser.close()
  }
}
