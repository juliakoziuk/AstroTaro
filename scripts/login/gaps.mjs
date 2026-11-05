// Перевірка суцільності фону екрана Login на різних розмірах вікна (npm run dev має бути запущений).
//   node scripts/login/gaps.mjs            — друкує «деталізацію» фону по боках картки й пише PNG у node_modules/.cache/login-gaps
// Деталізація = стандартне відхилення яскравості у вікнах 48px між бічною панеллю й карткою та праворуч від картки
// (береться найгірше вікно: будь-яка плоска ділянка = провал).
// Плоска заливка дає ~0, малюнок — десятки. Поріг MIN_DETAIL; код виходу 1, якщо десь нижче.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../landing-diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'node_modules/.cache/login-gaps')
const URL_ = process.env.URL || 'http://localhost:5173/app.html?clean=1#/login'
const MIN_DETAIL = 6 // плоска заливка давала 3.5–4, найтемніша ділянка з малюнком — 7.5
const SIZES = [
  [1535, 1024], // еталонна пропорція 3:2 (шва бути не повинно)
  [1917, 1000], // типовий ноутбук (скріншот користувача)
  [2560, 1100], // дуже широкий
  [1280, 800], // трохи ширший за 3:2
]

// stats() у sharp ігнорує extract, тож ділянку спершу вирізаємо в окремий буфер
async function detail(png, [x, y, w, h]) {
  const piece = await sharp(png).extract({ left: Math.round(x), top: Math.round(y), width: Math.round(w), height: Math.round(h) }).greyscale().toBuffer()
  const { channels } = await sharp(piece).stats()
  return channels[0].stdev
}

fs.mkdirSync(OUT, { recursive: true })
const browser = await launch()
const page = await browser.newPage()
let failed = false
for (const [W, H] of SIZES) {
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  await page.goto(URL_, { waitUntil: 'networkidle0', timeout: 120000 })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
  })
  await new Promise((r) => setTimeout(r, 600))
  const png = await page.screenshot({ type: 'png' })
  fs.writeFileSync(path.join(OUT, `${W}x${H}.png`), png)
  const box = await page.evaluate(() => {
    const r = (sel) => document.querySelector(sel).getBoundingClientRect().toJSON()
    return { card: r('.v-login .card'), stage: r('.v-login .stage') }
  })
  const u = box.stage.height / 1024
  const top = box.stage.top + box.stage.height * 0.3
  const hh = box.stage.height * 0.55
  // вікна по 48px між бічною панеллю (x = 242 одиниці) й карткою та від картки до краю вікна
  const strips = [
    ['ліворуч', 242 * u + 4, box.card.left - 4],
    ['праворуч', box.card.right + 4, W - 4],
  ]
  const lines = []
  let ok = true
  for (const [name, from, to] of strips) {
    let min = Infinity
    for (let x = from; x + 48 <= to; x += 24) min = Math.min(min, await detail(png, [x, top, 48, hh]))
    ok &&= min >= MIN_DETAIL
    lines.push(`${name}: мін. ${min === Infinity ? '—' : min.toFixed(1)} (${Math.round(to - from)}px)`)
  }
  failed ||= !ok
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${W}x${H}  ${lines.join('   ')}`)
}
await browser.close()
process.exit(failed ? 1 : 0)
