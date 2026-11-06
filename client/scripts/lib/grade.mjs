// Підгонка відтінку синього одного зображення під палітру іншого (тут: екран Login → Landing).
// Для «синіх» пікселів (відтінок 170–290°) за кожної яскравості V порівнюємо медіану насиченості й відтінку
// у цільовому зображенні та в оригіналі: S' = S · k(V), H' = H + ΔH(V). Золото й нейтральні кольори не чіпаємо.
import sharp from 'sharp'

const rgb2hsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, mx ? d / mx : 0, mx]
}
const hsv2rgb = (h, s, v) => {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  const k = Math.floor(h / 60) % 6
  if (k === 0) [r, g, b] = [c, x, 0]
  else if (k === 1) [r, g, b] = [x, c, 0]
  else if (k === 2) [r, g, b] = [0, c, x]
  else if (k === 3) [r, g, b] = [0, x, c]
  else if (k === 4) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

// смуги яскравості V, у яких порівнюємо палітри
const BANDS = [[0.03, 0.08], [0.08, 0.12], [0.12, 0.17], [0.17, 0.24], [0.24, 0.34], [0.34, 0.5], [0.5, 0.7]]
const median = (a) => (a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : NaN)
const blueWeight = (h) => (h < 170 || h > 290 ? 0 : h < 190 ? (h - 170) / 20 : h > 270 ? (290 - h) / 20 : 1)

async function bandStats(input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const hs = BANDS.map(() => [])
  const ss = BANDS.map(() => [])
  for (let i = 0; i < info.width * info.height; i++) {
    const [h, s, v] = rgb2hsv(data[i * 3], data[i * 3 + 1], data[i * 3 + 2])
    if (!(h >= 180 && h <= 280 && s > 0.2)) continue
    const k = BANDS.findIndex(([a, b]) => v >= a && v < b)
    if (k >= 0) {
      hs[k].push(h)
      ss[k].push(s)
    }
  }
  return BANDS.map((b, k) => ({ v: (b[0] + b[1]) / 2, n: hs[k].length, h: median(hs[k]), s: median(ss[k]) }))
}

/** Будує криві k(V) і ΔH(V) за двома зображеннями (мало пікселів у смузі — смуга ігнорується). */
export async function buildGrade(targetImage, sourceImage) {
  const t = await bandStats(targetImage)
  const s = await bandStats(sourceImage)
  const pts = []
  BANDS.forEach((_, k) => {
    if (t[k].n < 500 || s[k].n < 500) return
    pts.push({ v: t[k].v, k: Math.min(1.15, Math.max(0.4, t[k].s / s[k].s)), dh: t[k].h - s[k].h })
  })
  const interp = (v, key) => {
    if (v <= pts[0].v) return pts[0][key]
    if (v >= pts[pts.length - 1].v) return pts[pts.length - 1][key]
    for (let i = 1; i < pts.length; i++) {
      if (v <= pts[i].v) {
        const a = pts[i - 1]
        const b = pts[i]
        return a[key] + ((b[key] - a[key]) * (v - a.v)) / (b.v - a.v)
      }
    }
    return pts[pts.length - 1][key]
  }
  return { pts, kAt: (v) => interp(v, 'k'), dhAt: (v) => interp(v, 'dh') }
}

/** Застосовує підгонку до RGB-буфера (3 канали). */
export function applyGrade(rgb, grade) {
  const out = Buffer.from(rgb)
  for (let i = 0; i < rgb.length; i += 3) {
    const [h, s, v] = rgb2hsv(rgb[i], rgb[i + 1], rgb[i + 2])
    const w = blueWeight(h) * Math.min(1, s / 0.15)
    if (w <= 0) continue
    const k = 1 + (grade.kAt(v) - 1) * w
    const dh = grade.dhAt(v) * w
    const [r, g, b] = hsv2rgb((h + dh + 360) % 360, Math.min(1, s * k), v)
    out[i] = Math.max(0, Math.min(255, Math.round(r)))
    out[i + 1] = Math.max(0, Math.min(255, Math.round(g)))
    out[i + 2] = Math.max(0, Math.min(255, Math.round(b)))
  }
  return out
}

export { bandStats, BANDS }
