// Будує «чисту плиту» сцени з референсу: прибирає текст, кнопки, іконки й підписи панелі,
// а все інше лишає пікселями оригіналу (візерунки, тіні, зерно, рамка, панель).
//   node scripts/build-plate.mjs
// Вихід (src/landing/art/): plate-clean.png (1x, для вимірів і трасування), plate-1x/2x(/4x).webp (для сайту),
// fill.webp (плитка-«заповнювач» для розтягування сцени на широких екранах).
// Сцена без рамки референсу (її краї «затікають» на 4 px), без роздільників панелі (їх малює CSS).
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'src/landing/art')
const STAGE = { left: 22, top: 44, width: 981, height: 639 }
const W = STAGE.width
const H = STAGE.height

// ---------- зони, де лежить текст/UI (координати сцени 981x639) ----------
// threshold-зони: маска = яскравіші/темніші за локальний фон штрихи
const TEXT_ZONES = [
  [28, 14, 40, 36], // знак-місяць логотипу
  [62, 20, 70, 26], // LOSTIQ
  [434, 16, 112, 36], // MYSTIQ
  [52, 82, 256, 86], // заголовок (зірочка зліва від «D» лишається — вона частина ілюстрації)
  [46, 178, 372, 118], // абзац
]
// форми, що стираються цілком (кнопки, кнопка мови, диски іконок, підписи панелі — разом із тінню)
const SHAPES = [
  { type: 'rrect', box: [108, 548, 78, 50], r: 0 }, // Таро
  { type: 'rrect', box: [292, 548, 169, 50], r: 0 }, // Діаріум снів
  { type: 'rrect', box: [525, 548, 153, 50], r: 0 }, // Астрологія
  { type: 'rrect', box: [745, 548, 168, 50], r: 0 }, // ШІ Асистент
  { type: 'rrect', box: [51, 305, 160, 40], r: 20 }, // Розпочати
  { type: 'rrect', box: [217, 305, 162, 40], r: 20 }, // Вхід
  { type: 'rrect', box: [869, 14, 78, 34], r: 8 }, // кнопка мови
  // роздільники панелі (1 px; на широкому екрані колонки розтягуються, тож їх малює CSS)
  { type: 'rrect', box: [261, 462, 7, 138], r: 0 },
  { type: 'rrect', box: [487, 462, 7, 138], r: 0 },
  { type: 'rrect', box: [712, 462, 7, 138], r: 0 },
  { type: 'disc', c: [148.5, 503.5], r: 39 },
  { type: 'disc', c: [376.5, 503.5], r: 39 },
  { type: 'disc', c: [602.5, 503.5], r: 39 },
  { type: 'disc', c: [828.5, 503.5], r: 39 },
]
const THRESH = 14 // різниця яскравості зі згладженим фоном
const DILATE = 3

const { data: rgb } = await sharp(path.join(root, 'img.png'))
  .extract(STAGE)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
const lum = await sharp(path.join(root, 'img.png')).extract(STAGE).greyscale().raw().toBuffer()
const med = await sharp(path.join(root, 'img.png')).extract(STAGE).greyscale().median(31).raw().toBuffer()

// ---------- маска ----------
let mask = new Uint8Array(W * H)
for (const [x, y, w, h] of TEXT_ZONES) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (Math.abs(lum[j * W + i] - med[j * W + i]) > THRESH) mask[j * W + i] = 1
  }
}
const inRR = (x, y, [bx, by, bw, bh], r) => {
  const cx = Math.min(Math.max(x, bx + r), bx + bw - r)
  const cy = Math.min(Math.max(y, by + r), by + bh - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}
for (const s of SHAPES) {
  const [x0, y0, x1, y1] =
    s.type === 'disc'
      ? [s.c[0] - s.r, s.c[1] - s.r, s.c[0] + s.r, s.c[1] + s.r]
      : [s.box[0], s.box[1], s.box[0] + s.box[2], s.box[1] + s.box[3]]
  for (let j = Math.floor(y0); j <= Math.ceil(y1); j++) for (let i = Math.floor(x0); i <= Math.ceil(x1); i++) {
    const inside = s.type === 'disc' ? (i - s.c[0]) ** 2 + (j - s.c[1]) ** 2 <= s.r * s.r : inRR(i, j, s.box, s.r)
    if (inside) mask[j * W + i] = 1
  }
}

function dilate(m, r) {
  const out = new Uint8Array(m.length)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!m[y * W + x]) continue
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      if (i * i + j * j > r * r) continue
      const xx = x + i
      const yy = y + j
      if (xx >= 0 && yy >= 0 && xx < W && yy < H) out[yy * W + xx] = 1
    }
  }
  return out
}
mask = dilate(mask, DILATE)

// ---------- гармонічний inpaint ----------
const img = new Float32Array(W * H * 3)
for (let i = 0; i < img.length; i++) img[i] = rgb[i]
const idx = []
for (let i = 0; i < W * H; i++) if (mask[i]) idx.push(i)

// 1) початкове заповнення «цибулинням» від відомих пікселів
const known = new Uint8Array(W * H)
for (let i = 0; i < W * H; i++) known[i] = mask[i] ? 0 : 1
let frontier = idx.slice()
while (frontier.length) {
  const next = []
  const fill = []
  for (const p of frontier) {
    const x = p % W
    const y = (p / W) | 0
    let n = 0
    const acc = [0, 0, 0]
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      if (!i && !j) continue
      const xx = x + i
      const yy = y + j
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
      const q = yy * W + xx
      if (known[q]) {
        n++
        for (let c = 0; c < 3; c++) acc[c] += img[q * 3 + c]
      }
    }
    if (n) fill.push([p, acc.map((v) => v / n)])
    else next.push(p)
  }
  if (!fill.length) break
  for (const [p, v] of fill) {
    for (let c = 0; c < 3; c++) img[p * 3 + c] = v[c]
    known[p] = 1
  }
  frontier = next
}
// 2) релаксація Гаусса—Зейделя (гармонічне продовження меж)
for (let it = 0; it < 500; it++) {
  for (const p of idx) {
    const x = p % W
    const y = (p / W) | 0
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue
    for (let c = 0; c < 3; c++) {
      img[p * 3 + c] = 0.25 * (img[(p - 1) * 3 + c] + img[(p + 1) * 3 + c] + img[(p - W) * 3 + c] + img[(p + W) * 3 + c])
    }
  }
}

// 3) перенесення зерна/текстури з сусідніх чистих ділянок (щоб заплатка не була «пластиковою»)
const harm = Buffer.alloc(W * H * 3)
for (let i = 0; i < harm.length; i++) harm[i] = Math.max(0, Math.min(255, Math.round(img[i])))
const blurred = await sharp(harm, { raw: { width: W, height: H, channels: 3 } }).blur(2.2).raw().toBuffer()
const safe = dilate(mask, 7) // джерело текстури не має торкатися інших штрихів
// «спокійність» ділянки: середня висока частота в околі 9x9 (інтегральне зображення) — беремо зерно лише звідти,
// де немає ліній і візерунків, інакше під підписами лишаються смуги
const integral = new Float64Array((W + 1) * (H + 1))
for (let y = 0; y < H; y++) {
  let row = 0
  for (let x = 0; x < W; x++) {
    const q = (y * W + x) * 3 + 1
    row += Math.abs(rgb[q] - blurred[q])
    integral[(y + 1) * (W + 1) + x + 1] = integral[y * (W + 1) + x + 1] + row
  }
}
const activity = (x, y, r = 4) => {
  const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(W, x + r + 1), y1 = Math.min(H, y + r + 1)
  const s = integral[y1 * (W + 1) + x1] - integral[y0 * (W + 1) + x1] - integral[y1 * (W + 1) + x0] + integral[y0 * (W + 1) + x0]
  return s / ((x1 - x0) * (y1 - y0))
}
const CALM = Number(process.env.CALM || 2.2)
const SHIFTS = [[46, 0], [-46, 0], [0, 40], [0, -40], [92, 0], [-92, 0], [0, 80], [0, -80], [70, 40], [-70, -40], [140, 0], [-140, 0], [0, 120], [0, -120]]
const GRAIN_CLAMP = 5
const out = Buffer.from(rgb)
let transplanted = 0
for (const p of idx) {
  const x = p % W
  const y = (p / W) | 0
  const shift = SHIFTS.find(([dx, dy]) => {
    const xx = x + dx
    const yy = y + dy
    return xx >= 0 && yy >= 0 && xx < W && yy < H && !safe[yy * W + xx] && activity(xx, yy) < CALM
  })
  for (let c = 0; c < 3; c++) {
    let hf = 0
    if (shift) {
      const q = ((y + shift[1]) * W + x + shift[0]) * 3 + c
      hf = Math.max(-GRAIN_CLAMP, Math.min(GRAIN_CLAMP, rgb[q] - blurred[q]))
    }
    out[p * 3 + c] = Math.max(0, Math.min(255, Math.round(img[p * 3 + c] + hf)))
  }
  if (shift) transplanted++
}

/**
 * Прибирає рамку-«картку» референсу. У вирізці референсу рамка лишилась лише зверху й зліва (праворуч і знизу вона
 * за межами кадру), тож ці краї «затікають» сусідніми пікселями на `edge` px, а лівий верхній куточок (заокруглення) — на `corner`.
 */
function bleedEdges(buf, w, h, edge, corner) {
  const o = Buffer.from(buf)
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inCorner = x < corner && y < corner
    const bx = inCorner ? corner : x < edge ? edge : 0
    const by = inCorner ? corner : y < edge ? edge : 0
    if (x >= bx && y >= by) continue
    const sx = cl(x, bx, w - 1)
    const sy = cl(y, by, h - 1)
    const si = (sy * w + sx) * 3
    const di = (y * w + x) * 3
    o[di] = buf[si]
    o[di + 1] = buf[si + 1]
    o[di + 2] = buf[si + 2]
  }
  return o
}
const outB = bleedEdges(out, W, H, 4, 9)

fs.mkdirSync(OUT, { recursive: true })
const clean = sharp(outB, { raw: { width: W, height: H, channels: 3 } })
await clean.clone().png().toFile(path.join(OUT, 'plate-clean.png'))
// маска для перевірки
const maskImg = Buffer.alloc(W * H)
for (let i = 0; i < W * H; i++) maskImg[i] = mask[i] ? 255 : 0
const debugDir = path.join(root, 'node_modules/.cache/landing-diff')
fs.mkdirSync(debugDir, { recursive: true })
await sharp(maskImg, { raw: { width: W, height: H, channels: 1 } }).png().toFile(path.join(debugDir, 'plate-mask.png'))

// ---------- плита для сайту: набір розмірів для srcset ----------
//  1x — точні піксельні дані референсу (саме вона дає збіг 1:1 на екрані ~981px),
//  2x — Lanczos + легке підвищення різкості (для Retina / широких екранів),
//  4x — лише якщо задано HI_RES=<ШІ-апскейл.png> (Real-ESRGAN / Upscayl), інакше пропускається.
const variants = [
  { file: 'plate-1x.webp', width: W, webp: { quality: 99, smartSubsample: false, effort: 6 }, base: clean.clone() },
  {
    file: 'plate-2x.webp',
    width: W * 2,
    webp: { quality: 90, smartSubsample: false, effort: 6 },
    base: clean.clone().resize(W * 2, H * 2, { kernel: 'lanczos3' }).sharpen({ sigma: 0.8, m1: 0.6, m2: 1.4 }),
  },
]
const hi = process.env.HI_RES
if (hi && fs.existsSync(hi)) {
  // ШІ-апскейл (Real-ESRGAN x4plus) не береться «як є»: він зсуває тони й вигадує деталі. Беремо від нього лише
  // високочастотну «деталь» (оригінал мінус розмиття) і додаємо до чесного Lanczos ×4: тони лишаються оригінальними,
  // різкість майже як у ШІ. На фрагменті арту: SSIM назад до оригіналу 0.98 (як у Lanczos), різкість 12 проти 7.
  const SIGMA = Number(process.env.AI_DETAIL_SIGMA || 3)
  const K = Number(process.env.AI_DETAIL_K || 0.65)
  const BW = W * 4
  const BH = H * 4
  const dim = { raw: { width: BW, height: BH, channels: 3 } }
  const lan = await clean.clone().resize(BW, BH, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer()
  const aiPng = await sharp(hi).resize(BW, BH, { kernel: 'lanczos3' }).removeAlpha().png().toBuffer()
  const ai = await sharp(aiPng).raw().toBuffer()
  const low = await sharp(ai, dim).blur(SIGMA).raw().toBuffer()
  const merged = Buffer.alloc(lan.length)
  for (let i = 0; i < merged.length; i++) {
    merged[i] = Math.max(0, Math.min(255, Math.round(lan[i] + K * (ai[i] - low[i]))))
  }
  variants.push({
    file: 'plate-4x.webp',
    width: BW,
    webp: { quality: 86, smartSubsample: false, effort: 6 },
    base: sharp(bleedEdges(merged, BW, BH, 16, 36), dim), // рамка лишилась зверху й зліва
  })
}
for (const v of variants) {
  await v.base.webp(v.webp).toFile(path.join(OUT, v.file))
  console.log(v.file.padEnd(14), `${v.width}w`.padEnd(7), (fs.statSync(path.join(OUT, v.file)).size / 1024).toFixed(0), 'KB')
}
// ---------- заповнювач для широких екранів ----------
// Між лівою й правою частинами плити (розріз на x = SEAM) на широкому екрані з'являється проміжок. Його заповнює плитка:
// середній профіль рядків біля розрізу (панель, її лінії, плавні градієнти) + синтетичне зерно — без візерунків, які
// могли б повторюватись. Краї частин плити плавно переходять у цю плитку (CSS-маска).
const SEAM = Number(process.env.SEAM || 335)
const HALF = 24
const TILE_W = 128 // одиниць сцени
const TS = 2 // масштаб плитки (px на одиницю)
// Профіль рядка: медіана по колонках біля розрізу (стійка до окремих візерунків). Нижня смуга під панеллю (y >= 617) —
// це листя з яскравими відблисками: беремо 35-й перцентиль, інакше посередині виходить непомітно світліша «підлога».
const STRIP_Y = 617
const prof = (x0, x1) => {
  const p = new Float32Array(H * 3)
  for (let y = 0; y < H; y++) {
    const q = y >= STRIP_Y ? 0.35 : 0.5
    for (let c = 0; c < 3; c++) {
      const vals = []
      for (let x = x0; x < x1; x++) vals.push(outB[(y * W + x) * 3 + c])
      vals.sort((a, b) => a - b)
      p[y * 3 + c] = vals[Math.min(vals.length - 1, Math.floor(vals.length * q))]
    }
  }
  return p
}
const pL = prof(SEAM - HALF, SEAM)
const pR = prof(SEAM, SEAM + HALF)
let dMax = 0
let dSum = 0
for (let i = 0; i < pL.length; i++) { const d = Math.abs(pL[i] - pR[i]); dSum += d; if (d > dMax) dMax = d }
// де лівий і правий профілі розходяться (праворуч від розрізу починається візерунок) — беремо темніший, без «слідів» візерунка
const pAvg = pL.map((v, i) => (Math.abs(v - pR[i]) > 5 ? Math.min(v, pR[i]) : (v + pR[i]) / 2))
// м'яке згладження профілю по вертикалі (σ ≈ 1.5 рядка), щоб не лишити слідів зерна зі смуги в 48 колонок
const smooth = new Float32Array(pAvg.length)
for (let y = 0; y < H; y++) for (let c = 0; c < 3; c++) {
  let acc = 0
  let wsum = 0
  for (let k = -3; k <= 3; k++) {
    const yy = Math.min(H - 1, Math.max(0, y + k))
    const wgt = Math.exp(-(k * k) / (2 * 1.5 * 1.5))
    acc += pAvg[yy * 3 + c] * wgt
    wsum += wgt
  }
  smooth[y * 3 + c] = acc / wsum
}
// амплітуда зерна — з реальної плити біля розрізу (стд. відхилення від профілю по рядках)
let varSum = 0
let varN = 0
for (let y = 20; y < 420; y++) for (let x = SEAM - HALF; x < SEAM + HALF; x++) {
  const d = outB[(y * W + x) * 3 + 1] - smooth[y * 3 + 1]
  varSum += d * d
  varN++
}
const GRAIN = Math.sqrt(varSum / varN)
let seed = 12345
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const TW = TILE_W * TS
const TH = H * TS
const noise = new Float32Array(TW * TH)
for (let i = 0; i < noise.length; i++) noise[i] = rnd() + rnd() + rnd() - 1.5 // ≈ N(0, 0.5)
// просте просторове згладження шуму (σ ≈ 0.7 px), щоб зерно було схоже на справжнє
const nGray = Buffer.alloc(TW * TH)
for (let i = 0; i < nGray.length; i++) nGray[i] = Math.max(0, Math.min(255, Math.round(128 + noise[i] * 80)))
const nBlur = await sharp(nGray, { raw: { width: TW, height: TH, channels: 1 } }).blur(0.7).raw().toBuffer()
let nvar = 0
for (let i = 0; i < nBlur.length; i++) nvar += (nBlur[i] - 128) ** 2
const nStd = Math.sqrt(nvar / nBlur.length) || 1
const tile = Buffer.alloc(TW * TH * 3)
for (let y = 0; y < TH; y++) {
  const sy = Math.min(H - 1, Math.floor(y / TS))
  for (let x = 0; x < TW; x++) {
    const g = ((nBlur[y * TW + x] - 128) / nStd) * GRAIN
    for (let c = 0; c < 3; c++) tile[(y * TW + x) * 3 + c] = Math.max(0, Math.min(255, Math.round(smooth[sy * 3 + c] + g)))
  }
}
// плитка повторюється по горизонталі: краї шуму не збігаються, тож згладжуємо шов 8-піксельним кросфейдом
const FADE = 8
for (let y = 0; y < TH; y++) for (let k = 0; k < FADE; k++) {
  const t = (k + 1) / (FADE + 1)
  const a = (y * TW + (TW - FADE + k)) * 3
  const b = (y * TW + k) * 3
  for (let c = 0; c < 3; c++) tile[a + c] = Math.round(tile[a + c] * (1 - t) + tile[b + c] * t)
}
await sharp(tile, { raw: { width: TW, height: TH, channels: 3 } })
  .webp({ quality: 92, smartSubsample: false, effort: 6 })
  .toFile(path.join(OUT, 'fill.webp'))
console.log('fill.webp', (fs.statSync(path.join(OUT, 'fill.webp')).size / 1024).toFixed(0), 'KB',
  `| розріз x=${SEAM}, різниця профілів лівий/правий: середня ${(dSum / pL.length).toFixed(2)}, макс ${dMax.toFixed(1)}, зерно σ=${GRAIN.toFixed(2)}`)
console.log('masked px:', idx.length, 'with transplanted grain:', transplanted)
