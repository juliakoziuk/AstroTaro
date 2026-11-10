// Переносить намальовану корону з картки Pro на картку Premium на плиті екрана тарифів (src/app/art/pricing*.webp).
// Корона була намальована на плиті разом із фоном, тож: 1) закриваємо стару шматком чистого фону тієї ж картки (трохи нижче,
// з м'якими краями), 2) вирізаємо корону за «золотавістю» пікселів і накладаємо на Premium в тому ж місці картки.
// Запуск: node scripts/app/move-crown.mjs [теки з плитами]. Повторний запуск нічого не псує лише на свіжій плиті (git checkout).
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'

sharp.cache(false) // інакше на Windows файл лишається зайнятим і його не перезаписати

const FILES = [
  ['src/app/art/pricing.webp', 1],
  ['src/app/art/pricing-2x.webp', 2],
]
// у координатах плити 1536 x 1024
const CROWN = { x: 980, y: 390, w: 54, h: 50 } // корона Pro із запасом навколо
const DX = 291 // різниця між правими краями карток Premium і Pro
const FEATHER = 6

const gold = (r, g, b) => Math.max(0, Math.min(1, (r - b - 30) / 50)) // 0 — фон, 1 — золото

for (const [file, k] of FILES) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const at = (x, y) => (y * W + x) * 4
  const out = Buffer.from(data)
  const box = { x: CROWN.x * k, y: CROWN.y * k, w: CROWN.w * k, h: CROWN.h * k }
  // 1) корона з усім навколо, ще до змін
  const crown = []
  for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) {
    const i = at(box.x + x, box.y + y)
    crown.push({ x, y, a: gold(data[i], data[i + 1], data[i + 2]), r: data[i], g: data[i + 1], b: data[i + 2] })
  }
  // 2) закриваємо стару корону: у кожному рядку плавний перехід від кольору зліва до кольору справа від неї (так зберігається
  // оранжеве сяйво картки Pro), краї м'які
  const side = (x, y) => [0, 1, 2].map((c) => [-2, -1, 0, 1, 2].reduce((sum, d) => sum + data[at(x + d, y) + c], 0) / 5)
  for (let y = 0; y < box.h; y++) {
    const left = side(box.x - 6 * k, box.y + y)
    const right = side(box.x + box.w + 6 * k, box.y + y)
    for (let x = 0; x < box.w; x++) {
      const edge = Math.min(x, y, box.w - 1 - x, box.h - 1 - y)
      const w = Math.min(1, edge / (FEATHER * k))
      const to = at(box.x + x, box.y + y)
      const t = x / (box.w - 1)
      for (let c = 0; c < 3; c++) out[to + c] = Math.round(data[to + c] * (1 - w) + (left[c] * (1 - t) + right[c] * t) * w)
    }
  }
  // 3) корона на Premium
  for (const p of crown) {
    if (p.a <= 0) continue
    const to = at(box.x + p.x + DX * k, box.y + p.y)
    out[to] = Math.round(out[to] * (1 - p.a) + p.r * p.a)
    out[to + 1] = Math.round(out[to + 1] * (1 - p.a) + p.g * p.a)
    out[to + 2] = Math.round(out[to + 2] * (1 - p.a) + p.b * p.a)
  }
  writeFileSync(file, await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality: 92 }).toBuffer())
  console.log(file, 'ok')
}
