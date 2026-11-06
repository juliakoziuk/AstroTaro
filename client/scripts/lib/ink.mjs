// «Чорнильне» векторне трасування елемента: різниця «оригінал − основа» (світліші або темніші за основу штрихи)
// трасується на кількох порогах (multi-level potrace через vtracer) і збирається з напівпрозорих шарів,
// колір кожного шару розв'язується за даними оригіналу. Результат — SVG на прозорому тлі.
import sharp from 'sharp'
import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from '@neplex/vectorizer'

const TRACE = {
  hierarchical: Hierarchical.Stacked,
  mode: PathSimplifyMode.Spline,
  maxIterations: 10,
  lengthThreshold: 4,
  cornerThreshold: 60,
  spliceThreshold: 45,
  pathPrecision: 1,
  colorMode: ColorMode.Binary,
  colorPrecision: 6,
  layerDifference: 16,
  filterSpeckle: 4,
}

export const LEVELSETS = {
  A: [{ t: 0.16, a: 0.25 }, { t: 0.36, a: 0.4 }, { t: 0.62, a: 1 }],
  B: [{ t: 0.12, a: 0.25 }, { t: 0.28, a: 0.4 }, { t: 0.5, a: 1 }],
  C: [{ t: 0.09, a: 0.3 }, { t: 0.2, a: 0.4 }, { t: 0.36, a: 1 }],
  E: [{ t: 0.07, a: 0.18 }, { t: 0.16, a: 0.3 }, { t: 0.3, a: 0.4 }, { t: 0.5, a: 0.6 }, { t: 0.74, a: 1 }],
}
const GAINS = [0.9, 1, 1.1, 1.25, 1.4]
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

/**
 * @param G  оригінал (RGB), B — основа під елементом (RGB), обидва W x H
 * @returns {svg, colors, set, mae, ratio}
 */
export async function traceInk({ zone, G, B, W, H, polarity = 'bright', floor = 0, UP = 8, sets = ['A', 'B', 'C'], speckle = 4 }) {
  const [x, y, w, h] = zone
  const ink = new Float32Array(w * h)
  let max = 1
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = ((y + j) * W + x + i) * 3
    const d =
      polarity === 'bright'
        ? Math.max(G[p] - B[p], G[p + 1] - B[p + 1], G[p + 2] - B[p + 2])
        : Math.max(B[p] - G[p], B[p + 1] - G[p + 1], B[p + 2] - G[p + 2])
    ink[j * w + i] = Math.max(d - floor, 0)
    if (ink[j * w + i] > max) max = ink[j * w + i]
  }
  const gray = Buffer.alloc(w * h)
  for (let i = 0; i < w * h; i++) gray[i] = Math.round(255 * Math.min(1, ink[i] / max))
  const big = await sharp(gray, { raw: { width: w, height: h, channels: 1 } })
    .resize(w * UP, h * UP, { kernel: 'lanczos3' })
    .blur(0.9 * (UP / 8))
    .extractChannel(0)
    .raw()
    .toBuffer()
  const N = w * UP * h * UP
  if (big.length !== N) throw new Error(`ink ${w}x${h}: очікував ${N} px, отримав ${big.length}`)

  const pathsAt = new Map()
  const ts = new Set(sets.flatMap((s) => LEVELSETS[s].map((l) => l.t)))
  for (const t of ts) {
    const bin = Buffer.alloc(N * 3)
    const thr = t * 255
    for (let i = 0; i < N; i++) bin.fill(big[i] > thr ? 0 : 255, i * 3, i * 3 + 3)
    const png = await sharp(bin, { raw: { width: w * UP, height: h * UP, channels: 3 } }).png().toBuffer()
    const svg = await vectorize(png, { ...TRACE, filterSpeckle: speckle })
    pathsAt.set(t, [...svg.matchAll(/<path[^>]*\/>/g)].map((m) => m[0].replace(/fill="[^"]*"/, '')).join(''))
  }
  const build = (set, colors) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * UP} ${h * UP}" width="${w}" height="${h}">` +
    LEVELSETS[set].map(({ t, a }, k) => `<g fill="${toHex(colors[k])}" fill-opacity="${a}">${pathsAt.get(t)}</g>`).join('') +
    '</svg>'

  // Колір кожного шару розв'язується за даними оригіналу: піксель смуги k = послідовне накладання шарів 1..k на основу.
  // Для слабких шарів (альфа 0.25) ділення на альфу підсилює шум, і на малих значках виходять хибні відтінки
  // (зелене кільце, синя зірка). Тому колір шару змішується з «проєкцією» на колір основного (найяскравішого) шару:
  // вага власного розв'язку росте з кількістю пікселів смуги (≥ 400 — довіряємо повністю).
  const solveColors = (set, gain) => {
    const lv = LEVELSETS[set]
    const sum = lv.map(() => ({ o: [0, 0, 0], p: [0, 0, 0], n: 0 }))
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const f = ink[j * w + i] / max
      let k = -1
      lv.forEach((l, idx) => { if (f >= l.t) k = idx })
      if (k < 0) continue
      const q = ((y + j) * W + x + i) * 3
      for (let c = 0; c < 3; c++) { sum[k].o[c] += G[q + c]; sum[k].p[c] += B[q + c] }
      sum[k].n++
    }
    const solve = (k, colors) => {
      const S = sum[k]
      const a = lv[k].a
      const pm = S.p.map((v) => v / S.n)
      const o = S.o.map((v, c) => pm[c] + gain * (v / S.n - pm[c]))
      let under = pm.slice()
      for (let m = 0; m < k; m++) under = under.map((u, c) => (1 - lv[m].a) * u + lv[m].a * colors[m][c])
      return o.map((ov, c) => Math.max(0, Math.min(255, (ov - (1 - a) * under[c]) / a)))
    }
    // основний (останній) шар — з нього береться напрямок кольору
    const top = lv.length - 1
    const colors = new Array(lv.length)
    const order = [...lv.keys()]
    // спершу рахуємо від нижніх до верхніх (їм потрібні нижні для «під»), але основний колір беремо з верхнього шару,
    // тому проходимо двічі: чернетка → проєкція
    const draft = []
    order.forEach((k) => { draft[k] = sum[k].n < 4 ? (draft[k - 1] ?? [200, 170, 120]) : solve(k, draft) })
    const main = draft[top]
    order.forEach((k) => {
      if (sum[k].n < 4) { colors[k] = (colors[k - 1] ?? main).slice(); return }
      const own = solve(k, colors)
      if (k === top) { colors[k] = own.map(Math.round); return }
      const mm = main[0] * main[0] + main[1] * main[1] + main[2] * main[2] || 1
      const s = Math.max(0.35, Math.min(1.3, (own[0] * main[0] + own[1] * main[1] + own[2] * main[2]) / mm))
      const proj = main.map((v) => v * s)
      const wgt = Math.max(0, Math.min(1, (sum[k].n - 40) / 360))
      colors[k] = proj.map((v, c) => Math.round(v * (1 - wgt) + own[c] * wgt))
    })
    return colors
  }

  const crop = (buf) => sharp(buf, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x, top: y, width: w, height: h })
  const bg = await crop(B).png().toBuffer()
  const truth = await crop(G).removeAlpha().raw().toBuffer()
  const bgRaw = await sharp(bg).removeAlpha().raw().toBuffer()
  const mass = (buf) => {
    let m = 0
    for (let i = 0; i < buf.length; i++) m += polarity === 'bright' ? Math.max(0, buf[i] - bgRaw[i]) : Math.max(0, bgRaw[i] - buf[i])
    return m
  }
  const targetMass = mass(truth) || 1
  const cands = []
  for (const set of sets) {
    for (const g of GAINS) {
      const colors = solveColors(set, g)
      const comp = await sharp(bg).composite([{ input: Buffer.from(build(set, colors)) }]).removeAlpha().raw().toBuffer()
      let e = 0
      for (let i = 0; i < comp.length; i++) e += Math.abs(comp[i] - truth[i])
      cands.push({ err: e / comp.length, ratio: mass(comp) / targetMass, set, g, colors })
    }
  }
  const inBand = cands.filter((c) => Math.abs(c.ratio - 1) <= 0.08)
  const best = (inBand.length ? inBand : cands.sort((a, b) => Math.abs(a.ratio - 1) - Math.abs(b.ratio - 1)).slice(0, 3)).sort((a, b) => a.err - b.err)[0]
  return { svg: build(best.set, best.colors), colors: best.colors.map(toHex), set: best.set, gain: best.g, mae: best.err, ratio: best.ratio }
}
