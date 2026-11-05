// Збирає матеріали екрана Login з reference/login.webp (1535x1024) у src/login/art:
//   1) підганяє синій під палітру Landing (scripts/lib/grade.mjs),
//   2) стирає UI: G1 = «скляна картка + бічна панель без вмісту», P2 = «плита без картки» (арт),
//   3) card-*.webp — спрайт картки (прозорі кути й «арка»), plate-*.webp — арт, fill.webp — заповнювач для широких екранів,
//   4) ink/*.svg — векторні елементи (корона, значки, зірки) на прозорому тлі.
//   node scripts/build-login.mjs            (ONLY=ink — лише вектор; SKIP_INK=1 — без вектора)
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildGrade, applyGrade } from './lib/grade.mjs'
import { dilateMask, harmonicFill, addGrain } from './lib/inpaint.mjs'
import { traceInk } from './lib/ink.mjs'
import * as C from './login/config.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'src/login/art')
const INK = path.join(OUT, 'ink')
const DEBUG = path.join(root, 'node_modules/.cache/login-build')
for (const d of [OUT, INK, DEBUG]) fs.mkdirSync(d, { recursive: true })
const { W, H } = C
const rawImg = (b) => ({ raw: { width: W, height: H, channels: 3 } })
const t0 = Date.now()
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`)

// ---------- 1. відтінок синього ----------
const grade = await buildGrade(path.join(root, C.LANDING_PLATE), path.join(root, C.REF))
const G = applyGrade(await sharp(path.join(root, C.REF)).removeAlpha().raw().toBuffer(), grade)
await sharp(G, rawImg()).png().toFile(path.join(DEBUG, 'G-graded.png'))
log('graded')

// ---------- 2. маски ----------
const lum = await sharp(G, rawImg()).greyscale().raw().toBuffer()
const med = await sharp(G, rawImg()).greyscale().median(25).raw().toBuffer()
const inRR = (x, y, [bx, by, bw, bh], r) => {
  const cx = Math.min(Math.max(x, bx + r), bx + bw - r)
  const cy = Math.min(Math.max(y, by + r), by + bh - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}
function addShapes(mask, shapes) {
  for (const s of shapes) {
    const [bx, by, bw, bh] = s.box
    for (let j = by; j < by + bh; j++) for (let i = bx; i < bx + bw; i++) {
      if (s.type === 'rect' || inRR(i, j, s.box, s.r)) mask[j * W + i] = 1
    }
  }
}
/**
 * Заповнює замкнені «дірки» маски всередині зони: пікселі, до яких не можна дійти від краю зони по немаскованих.
 * Порогова маска ловить лише тонкі штрихи (суцільна фігура — будиночок, «повзунок» — для медіани є фоном), тож їхня
 * середина лишалась би в кадрі й псувала б заповнення («ореол» у дверях значка).
 */
function fillHoles(mask, [x, y, w, h]) {
  const reach = new Uint8Array(w * h)
  const queue = []
  const push = (i, j) => {
    if (i < 0 || j < 0 || i >= w || j >= h || reach[j * w + i] || mask[(y + j) * W + x + i]) return
    reach[j * w + i] = 1
    queue.push(j * w + i)
  }
  for (let i = 0; i < w; i++) { push(i, 0); push(i, h - 1) }
  for (let j = 0; j < h; j++) { push(0, j); push(w - 1, j) }
  for (let k = 0; k < queue.length; k++) {
    const i = queue[k] % w
    const j = (queue[k] / w) | 0
    push(i + 1, j); push(i - 1, j); push(i, j + 1); push(i, j - 1)
  }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!reach[j * w + i] && !mask[(y + j) * W + x + i] && !C.inKeep(x + i, y + j)) mask[(y + j) * W + x + i] = 1
  }
}
// зона може мати 5-й елемент 'ring': корона — замкнені кільця, їх внутрішність (тло й місяць) не маскується
function addThreshold(mask, zones, skip) {
  for (const zone of zones) {
    const [x, y, w, h, flag] = zone
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const p = j * W + i
      if (skip && skip[p]) continue
      if (C.inKeep(i, j)) continue
      if (Math.abs(lum[p] - med[p]) > C.THRESH) mask[p] = 1
    }
    if (flag !== 'ring') fillHoles(mask, [x, y, w, h])
  }
}
const shape = new Uint8Array(W * H)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (C.inCard(x, y)) shape[y * W + x] = 1
const grow = dilateMask(shape, W, H, 5)
const shrinkOfNot = dilateMask(shape.map((v) => 1 - v), W, H, 5)
const outlineBand = new Uint8Array(W * H)
for (let i = 0; i < W * H; i++) outlineBand[i] = grow[i] && shrinkOfNot[i] ? 1 : 0

const maskUI = new Uint8Array(W * H)
addThreshold(maskUI, C.SIDEBAR_TEXT)
addShapes(maskUI, C.SIDEBAR_SHAPES)
addThreshold(maskUI, C.CARD_TEXT, outlineBand)
addShapes(maskUI, C.CARD_SHAPES)
const maskUI3 = dilateMask(maskUI, W, H, C.DILATE)
for (let i = 0; i < W * H; i++) if (outlineBand[i] && shape[i] === 1) maskUI3[i] = 0 // рамку картки не чіпаємо

// ---------- 3. G1: вміст стерто, картка й панель — на місці ----------
let G1 = harmonicFill(G, W, H, maskUI3)
G1 = await addGrain(G1, G, W, H, maskUI3)
await sharp(G1, rawImg()).png().toFile(path.join(DEBUG, 'G1-no-ui.png'))
log('G1 (без UI) готово')

// ---------- 4. P2: плита без картки ----------
const maskCard = new Uint8Array(W * H)
const shapeFat = dilateMask(shape, W, H, 7)
for (let i = 0; i < W * H; i++) if (shapeFat[i]) maskCard[i] = 1
{
  const [x, y, w, h] = C.ORNAMENT_ZONE
  const orn = new Uint8Array(W * H)
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const p = j * W + i
    if (!shapeFat[p] && Math.abs(lum[p] - med[p]) > C.THRESH) orn[p] = 1
  }
  const ornFat = dilateMask(orn, W, H, 3)
  for (let i = 0; i < W * H; i++) if (ornFat[i]) maskCard[i] = 1
}
let P2 = harmonicFill(G1, W, H, maskCard)
P2 = await addGrain(P2, G1, W, H, maskCard, { tile: 14 })
// Арт по боках «дірки» не має різко обриватись: на широких екранах картка від'їжджає від країв, і обрізка стала б видимою.
// Тому арт (розмитий — як імла) «затікає» всередину дірки й розчиняється в темряві на MIRROR_D px.
const mist = await sharp(G1, rawImg()).blur(5).raw().toBuffer()
const MIRROR_D = 90
for (let y = 0; y < H; y++) {
  let lb = -1
  let rb = -1
  for (let x = 0; x < W; x++) if (maskCard[y * W + x]) { if (lb < 0) lb = x; rb = x }
  if (lb < 0 || rb - lb < 300) continue
  for (let d = 0; d < MIRROR_D; d++) {
    const a = 0.85 * (1 - d / MIRROR_D) ** 2
    for (const [dst, src] of [[lb + d, lb - 1 - d], [rb - d, rb + 1 + d]]) {
      if (src < 0 || src >= W || !maskCard[y * W + dst]) continue
      for (let c = 0; c < 3; c++) P2[(y * W + dst) * 3 + c] = Math.round(P2[(y * W + dst) * 3 + c] * (1 - a) + mist[(y * W + src) * 3 + c] * a)
    }
  }
}
await sharp(P2, rawImg()).png().toFile(path.join(DEBUG, 'P2-plate.png'))
log('P2 (плита) готово')

// ---------- 5. спрайт картки ----------
const SPR = { x: 600, y: 62, w: 649, h: 862 }
const SS = 4
const spriteRGBA = Buffer.alloc(SPR.w * SPR.h * 4)
for (let j = 0; j < SPR.h; j++) for (let i = 0; i < SPR.w; i++) {
  let cov = 0
  for (let sj = 0; sj < SS; sj++) for (let si = 0; si < SS; si++) {
    if (C.inCard(SPR.x + i + (si + 0.5) / SS, SPR.y + j + (sj + 0.5) / SS, 2)) cov++
  }
  const p = (j * SPR.w + i) * 4
  const q = ((SPR.y + j) * W + SPR.x + i) * 3
  spriteRGBA[p] = G1[q]
  spriteRGBA[p + 1] = G1[q + 1]
  spriteRGBA[p + 2] = G1[q + 2]
  spriteRGBA[p + 3] = Math.round((255 * cov) / (SS * SS))
}
const sprite = sharp(spriteRGBA, { raw: { width: SPR.w, height: SPR.h, channels: 4 } })
await sprite.clone().webp({ quality: 96, alphaQuality: 100, effort: 6 }).toFile(path.join(OUT, 'card-1x.webp'))
await sprite.clone().resize(SPR.w * 2, SPR.h * 2, { kernel: 'lanczos3' }).sharpen({ sigma: 0.7, m1: 0.5, m2: 1.2 }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(path.join(OUT, 'card-2x.webp'))
log(`спрайт картки ${SPR.w}x${SPR.h} (x=${SPR.x}, y=${SPR.y})`)

// ---------- 6. плита (srcset) і заповнювач ----------
const plate = sharp(P2, rawImg())
await plate.clone().webp({ quality: 96, smartSubsample: false, effort: 6 }).toFile(path.join(OUT, 'plate-1x.webp'))
await plate.clone().resize(W * 2, H * 2, { kernel: 'lanczos3' }).sharpen({ sigma: 0.8, m1: 0.6, m2: 1.4 }).webp({ quality: 88, smartSubsample: false, effort: 6 }).toFile(path.join(OUT, 'plate-2x.webp'))

const SEAM = C.SEAM
const HALF = 24
const TILE_W = 128
const TS = 2
{
  const prof = new Float32Array(H * 3)
  for (let y = 0; y < H; y++) for (let c = 0; c < 3; c++) {
    const v = []
    for (let x = SEAM - HALF; x < SEAM + HALF; x++) v.push(P2[(y * W + x) * 3 + c])
    v.sort((a, b) => a - b)
    prof[y * 3 + c] = v[v.length >> 1]
  }
  const smooth = new Float32Array(prof.length)
  for (let y = 0; y < H; y++) for (let c = 0; c < 3; c++) {
    let acc = 0
    let ws = 0
    // σ = 7 рядків: тон у «темній порожнечі» змінюється плавно, а дрібні «зарубки» профілю (краї картки, листя знизу)
    // дали б на широких екранах ледь помітні горизонтальні смуги
    for (let k = -21; k <= 21; k++) {
      const yy = Math.min(H - 1, Math.max(0, y + k))
      const wg = Math.exp(-(k * k) / (2 * 7 * 7))
      acc += prof[yy * 3 + c] * wg
      ws += wg
    }
    smooth[y * 3 + c] = acc / ws
  }
  let varSum = 0
  let varN = 0
  for (let y = 30; y < H - 30; y += 2) for (let x = SEAM - HALF; x < SEAM + HALF; x++) {
    const d = P2[(y * W + x) * 3 + 1] - smooth[y * 3 + 1]
    varSum += d * d
    varN++
  }
  const GRAIN = Math.sqrt(varSum / varN)
  let seed = 4242
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const TW = TILE_W * TS
  const TH = H * TS
  const noise = Buffer.alloc(TW * TH)
  for (let i = 0; i < noise.length; i++) noise[i] = Math.max(0, Math.min(255, Math.round(128 + (rnd() + rnd() + rnd() - 1.5) * 80)))
  const nb = await sharp(noise, { raw: { width: TW, height: TH, channels: 1 } }).blur(0.7).raw().toBuffer()
  let nv = 0
  for (let i = 0; i < nb.length; i++) nv += (nb[i] - 128) ** 2
  const nStd = Math.sqrt(nv / nb.length) || 1
  const tile = Buffer.alloc(TW * TH * 3)
  for (let y = 0; y < TH; y++) {
    const sy = Math.min(H - 1, Math.floor(y / TS))
    for (let x = 0; x < TW; x++) {
      const g = ((nb[y * TW + x] - 128) / nStd) * GRAIN
      for (let c = 0; c < 3; c++) tile[(y * TW + x) * 3 + c] = Math.max(0, Math.min(255, Math.round(smooth[sy * 3 + c] + g)))
    }
  }
  const FADE = 8
  for (let y = 0; y < TH; y++) for (let k = 0; k < FADE; k++) {
    const t = (k + 1) / (FADE + 1)
    const a = (y * TW + (TW - FADE + k)) * 3
    const b = (y * TW + k) * 3
    for (let c = 0; c < 3; c++) tile[a + c] = Math.round(tile[a + c] * (1 - t) + tile[b + c] * t)
  }
  await sharp(tile, { raw: { width: TW, height: TH, channels: 3 } }).webp({ quality: 92, smartSubsample: false, effort: 6 }).toFile(path.join(OUT, 'fill.webp'))
  // середній колір країв сцени — для фону сторінки
  let r = 0, g = 0, b = 0, n = 0
  for (let y = 0; y < H; y += 3) for (const x of [4, 8, 12, W - 12, W - 8, W - 4]) { r += P2[(y * W + x) * 3]; g += P2[(y * W + x) * 3 + 1]; b += P2[(y * W + x) * 3 + 2]; n++ }
  log(`плита й заповнювач готові (зерно σ=${GRAIN.toFixed(2)}, середній колір країв ${[r, g, b].map((v) => Math.round(v / n)).join(',')})`)
}

// ---------- 7. вектор ----------
if (process.env.SKIP_INK !== '1') {
  // основа під елементом: усередині картки — G1 (спрайт), поза нею — плита P2
  const B = Buffer.alloc(G.length)
  for (let i = 0; i < W * H; i++) {
    const src = shape[i] ? G1 : P2
    B[i * 3] = src[i * 3]
    B[i * 3 + 1] = src[i * 3 + 1]
    B[i * 3 + 2] = src[i * 3 + 2]
  }
  const only = process.env.ONLY?.split(',')
  const manifest = fs.existsSync(path.join(INK, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(INK, 'manifest.json'), 'utf8')) : {}
  for (const el of C.INK) {
    if (only && !only.includes(el.name)) continue
    let Bel = B
    if (el.inpaintBase) {
      // елемент лежить на тлі, якого немає в основі (золота кнопка стерта в G1): основа — оригінал без самого елемента
      const [zx, zy, zw, zh] = el.zone
      const m = new Uint8Array(W * H)
      for (let j = zy; j < zy + zh; j++) for (let i = zx; i < zx + zw; i++) if (Math.abs(lum[j * W + i] - med[j * W + i]) > C.THRESH) m[j * W + i] = 1
      const filled = harmonicFill(G, W, H, dilateMask(m, W, H, 2))
      Bel = Buffer.from(B)
      for (let j = zy; j < zy + zh; j++) for (let i = zx; i < zx + zw; i++) for (let c = 0; c < 3; c++) Bel[(j * W + i) * 3 + c] = filled[(j * W + i) * 3 + c]
    }
    const r = await traceInk({ zone: el.zone, G, B: Bel, W, H, polarity: el.polarity ?? 'bright', floor: el.floor ?? 0, UP: el.up ?? 8, sets: el.sets ?? ['A', 'B', 'C'], speckle: el.speckle ?? 4 })
    fs.writeFileSync(path.join(INK, `${el.name}.svg`), r.svg)
    manifest[el.name] = { zone: el.zone, colors: r.colors, set: r.set }
    log(`${el.name.padEnd(16)} ${(Buffer.byteLength(r.svg) / 1024).toFixed(0).padStart(4)} KB  набір ${r.set}  маса x${r.ratio.toFixed(2)}  MAE ${r.mae.toFixed(2)}`)
  }
  fs.writeFileSync(path.join(INK, 'manifest.json'), JSON.stringify(manifest, null, 2))
}
