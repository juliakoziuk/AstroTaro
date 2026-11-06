// Векторизація референсу лендінгу.  Запуск: node scripts/build-plate.mjs && node scripts/trace-landing.mjs
//  - scene.svg      : кольорове трасування чистої плити (режим ?art=vector)
//  - icon-*.svg,
//    brand-moon.svg : «чорнильні» векторні елементи на прозорому тлі: різниця «оригінал − плита»
//                     трасується на кількох порогах яскравості (метод multi-level potrace) і
//                     складається з напівпрозорих шарів одного золотого кольору.
//  - manifest.json  : де лежить кожен елемент (координати сцени 981x639)
import sharp from 'sharp'
import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from '@neplex/vectorizer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ART = path.join(root, 'src/landing/art')
const OUT = path.join(ART, 'traced')
fs.mkdirSync(OUT, { recursive: true })

const STAGE = { left: 22, top: 44, width: 981, height: 639 }
const W = STAGE.width
const H = STAGE.height

const traceOpts = {
  hierarchical: Hierarchical.Stacked,
  mode: PathSimplifyMode.Spline,
  maxIterations: 10,
  lengthThreshold: 4,
  cornerThreshold: 60,
  spliceThreshold: 45,
  pathPrecision: 1,
}

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + ' KB'

// ---------- 1. сцена (кольорове трасування) ----------
if (process.env.SKIP_SCENE !== '1') {
  const SCALE = Number(process.env.SCALE || 2)
  const png = await sharp(path.join(ART, 'plate-clean.png'))
    .resize(W * SCALE, H * SCALE, { kernel: 'lanczos3' })
    .png()
    .toBuffer()
  let svg = await vectorize(png, {
    ...traceOpts,
    colorMode: ColorMode.Color,
    colorPrecision: 7,
    filterSpeckle: 2,
    layerDifference: 8,
  })
  svg = svg
    .replace(/width="\d+"/, `width="${W}"`)
    .replace(/height="\d+"/, `height="${H}"`)
    .replace('<svg', `<svg viewBox="0 0 ${W * SCALE} ${H * SCALE}"`)
  fs.writeFileSync(path.join(OUT, 'scene.svg'), svg)
  console.log('scene.svg', kb(svg))
}

// ---------- 2. «чорнильні» елементи ----------
const orig = await sharp(path.join(root, '../assets/img.png')).extract(STAGE).removeAlpha().raw().toBuffer()
const clean = await sharp(path.join(ART, 'plate-clean.png')).removeAlpha().raw().toBuffer()

const ICON_CY = 463 // верх зони іконок
const ELEMENTS = {
  'icon-tarot': [109, ICON_CY, 80, 81],
  'icon-dreams': [337, ICON_CY, 80, 81],
  'icon-astrology': [563, ICON_CY, 80, 81],
  'icon-assistant': [789, ICON_CY, 80, 81],
  'brand-moon': [30, 16, 32, 34],
}
// набори порогів яскравості (частка від максимуму) і непрозорість шарів; для кожного елемента
// обирається набір + підсилення кольору, що дають найменшу піксельну похибку відносно оригіналу
const LEVELSETS = {
  A: [{ t: 0.16, a: 0.25 }, { t: 0.36, a: 0.4 }, { t: 0.62, a: 1 }],
  B: [{ t: 0.12, a: 0.25 }, { t: 0.28, a: 0.4 }, { t: 0.5, a: 1 }],
  C: [{ t: 0.09, a: 0.3 }, { t: 0.2, a: 0.4 }, { t: 0.36, a: 1 }],
}
// фон під елементом може мати власну текстуру (заливка кнопки): відрізаємо її, лишаючи лише яскраві штрихи
const FLOORS = {}
const GAINS = [0.9, 1, 1.1, 1.2, 1.35]
const UP = 8

const shade = (rgb, g) => rgb.map((v) => Math.min(255, Math.round(v * g)))
const toHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('')

const manifest = {}
for (const [name, [x, y, w, h]] of Object.entries(ELEMENTS)) {
  // карта «світла»: наскільки піксель яскравіший за чисту плиту
  const ink = new Float32Array(w * h)
  let max = 1
  const colorAcc = [0, 0, 0]
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = ((y + j) * W + x + i) * 3
    const d = Math.max(Math.max(orig[p] - clean[p], orig[p + 1] - clean[p + 1], orig[p + 2] - clean[p + 2]) - (FLOORS[name] ?? 0), 0)
    ink[j * w + i] = d
    if (d > max) max = d
  }
  const hi = []
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (ink[j * w + i] > max * 0.75) hi.push(((y + j) * W + x + i) * 3)
  }
  for (const p of hi) for (let c = 0; c < 3; c++) colorAcc[c] += orig[p + c]
  const color = colorAcc.map((v) => Math.min(255, Math.round(v / Math.max(1, hi.length))))

  const gray = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) gray[i] = Math.round(255 * Math.min(1, ink[i] / max))
  const big = await sharp(gray, { raw: { width: w, height: h, channels: 1 } })
    .resize(w * UP, h * UP, { kernel: 'lanczos3' })
    .blur(0.9)
    .extractChannel(0)
    .raw()
    .toBuffer()

  // трасуємо кожен унікальний поріг один раз
  const N = w * UP * h * UP
  if (big.length !== N) throw new Error(`${name}: expected ${N} px, got ${big.length}`)
  const pathsAt = new Map()
  for (const t of new Set(Object.values(LEVELSETS).flatMap((s) => s.map((l) => l.t)))) {
    // чорне = «є світло»
    const bin = Buffer.alloc(N * 3)
    const thr = t * 255
    for (let i = 0; i < N; i++) bin.fill(big[i] > thr ? 0 : 255, i * 3, i * 3 + 3)
    const png = await sharp(bin, { raw: { width: w * UP, height: h * UP, channels: 3 } }).png().toBuffer()
    const svg = await vectorize(png, {
      ...traceOpts,
      colorMode: ColorMode.Binary,
      colorPrecision: 6,
      layerDifference: 16,
      filterSpeckle: 4,
    })
    pathsAt.set(t, [...svg.matchAll(/<path[^>]*\/>/g)].map((m) => m[0].replace(/fill="[^"]*"/, '')).join(''))
  }
  // кожен шар має власний колір: ядро ліній світліше, краї тепліші. Кольори розв'язуємо за даними оригіналу:
  // піксель смуги k = послідовне накладання шарів 1..k на плиту -> рівняння для c_k.
  const build = (set, colors) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * UP} ${h * UP}" width="${w}" height="${h}">` +
    LEVELSETS[set].map(({ t, a }, k) => `<g fill="${toHex(colors[k])}" fill-opacity="${a}">${pathsAt.get(t)}</g>`).join('') +
    '</svg>'
  const solveColors = (set, gain) => {
    const lv = LEVELSETS[set]
    const sum = lv.map(() => ({ o: [0, 0, 0], p: [0, 0, 0], n: 0 }))
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const f = ink[j * w + i] / max
      let k = -1
      lv.forEach((l, idx) => { if (f >= l.t) k = idx })
      if (k < 0) continue
      const q = ((y + j) * W + x + i) * 3
      for (let c = 0; c < 3; c++) { sum[k].o[c] += orig[q + c]; sum[k].p[c] += clean[q + c] }
      sum[k].n++
    }
    const colors = []
    lv.forEach(({ a }, k) => {
      const S = sum[k]
      if (S.n < 4) { colors.push(color); return }
      const o = S.o.map((v, c) => { const pm = S.p[c] / S.n; return pm + gain * (v / S.n - pm) })
      const pm = S.p.map((v) => v / S.n)
      // що вже лежить під шаром k: плита, перекрита шарами 1..k-1 з уже знайденими кольорами
      let under = pm.slice()
      for (let m = 0; m < k; m++) under = under.map((u, c) => (1 - lv[m].a) * u + lv[m].a * colors[m][c])
      colors.push(o.map((ov, c) => Math.max(0, Math.min(255, Math.round((ov - (1 - a) * under[c]) / a)))))
    })
    return colors
  }

  // добір набору порогів: рендер на чистій плиті проти оригіналу
  const bg = await sharp(clean, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x, top: y, width: w, height: h }).png().toBuffer()
  const truth = await sharp(orig, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x, top: y, width: w, height: h }).removeAlpha().raw().toBuffer()
  const bgRaw = await sharp(bg).removeAlpha().raw().toBuffer()
  const mass = (buf) => {
    let m = 0
    for (let i = 0; i < buf.length; i++) m += Math.max(0, buf[i] - bgRaw[i])
    return m
  }
  const targetMass = mass(truth)
  const cands = []
  for (const set of Object.keys(LEVELSETS)) {
    for (const g of GAINS) {
      const colors = solveColors(set, g)
      const comp = await sharp(bg).composite([{ input: Buffer.from(build(set, colors)) }]).removeAlpha().raw().toBuffer()
      let e = 0
      for (let i = 0; i < comp.length; i++) e += Math.abs(comp[i] - truth[i])
      cands.push({ err: e / comp.length, ratio: mass(comp) / targetMass, set, g, colors })
    }
  }
  // «маса світла» має збігатися з оригіналом (±8 %), інакше лінії здаються блідішими; серед таких — найменша похибка
  const inBand = cands.filter((c) => Math.abs(c.ratio - 1) <= 0.08)
  const best = (inBand.length ? inBand : cands.sort((a, b) => Math.abs(a.ratio - 1) - Math.abs(b.ratio - 1)).slice(0, 3)).sort((a, b) => a.err - b.err)[0]
  const svg = build(best.set, best.colors)
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg)
  manifest[name] = { x, y, w, h, colors: best.colors.map(toHex) }
  console.log(name.padEnd(15), kb(svg), `набір ${best.set}, яскравість x${best.g}, кольори ${best.colors.map(toHex).join(' ')}, маса x${best.ratio.toFixed(2)}, MAE ${best.err.toFixed(2)}`)
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
