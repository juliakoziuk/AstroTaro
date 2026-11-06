// Метрики схожості двох RGB-буферів однакового розміру W x H: SSIM (сіра шкала, вікна 8x8) і MAE.
import sharp from 'sharp'
import pixelmatch from 'pixelmatch'
import fs from 'node:fs'
import path from 'node:path'

const gray = (rgb) => {
  const g = new Float32Array(rgb.length / 3)
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2]
  return g
}

export function ssim(a, b, W, [rx, ry, rw, rh], step = 4) {
  const ga = gray(a)
  const gb = gray(b)
  const C1 = (0.01 * 255) ** 2
  const C2 = (0.03 * 255) ** 2
  let sum = 0
  let n = 0
  for (let y = ry; y + 8 <= ry + rh; y += step) for (let x = rx; x + 8 <= rx + rw; x += step) {
    let ma = 0, mb = 0
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { ma += ga[(y + j) * W + x + i]; mb += gb[(y + j) * W + x + i] }
    ma /= 64; mb /= 64
    let va = 0, vb = 0, cv = 0
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const da = ga[(y + j) * W + x + i] - ma
      const db = gb[(y + j) * W + x + i] - mb
      va += da * da; vb += db * db; cv += da * db
    }
    va /= 63; vb /= 63; cv /= 63
    sum += ((2 * ma * mb + C1) * (2 * cv + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2))
    n++
  }
  return sum / n
}

export function mae(a, b, W, [rx, ry, rw, rh]) {
  let s = 0
  for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
    const p = (y * W + x) * 3
    s += Math.abs(a[p] - b[p]) + Math.abs(a[p + 1] - b[p + 1]) + Math.abs(a[p + 2] - b[p + 2])
  }
  return s / (rw * rh * 3)
}

export function report(ref, cur, W, regions) {
  const out = {}
  for (const [name, rect] of Object.entries(regions)) out[name] = { mae: +mae(ref, cur, W, rect).toFixed(2), ssim: +ssim(ref, cur, W, rect).toFixed(3) }
  return out
}

export async function writeDiff(dir, ref, cur, W, H) {
  fs.mkdirSync(dir, { recursive: true })
  const rgba = (rgb) => {
    const o = Buffer.alloc(W * H * 4)
    for (let i = 0; i < W * H; i++) { o[i * 4] = rgb[i * 3]; o[i * 4 + 1] = rgb[i * 3 + 1]; o[i * 4 + 2] = rgb[i * 3 + 2]; o[i * 4 + 3] = 255 }
    return o
  }
  const A = rgba(ref)
  const B = rgba(cur)
  const bad = pixelmatch(A, B, Buffer.alloc(W * H * 4), W, H, { threshold: 0.15, includeAA: true })
  const amp = Buffer.alloc(W * H * 3)
  for (let i = 0; i < W * H * 3; i++) amp[i] = Math.min(255, Math.abs(ref[i] - cur[i]) * 4)
  await sharp(A, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(dir, 'reference.png'))
  await sharp(B, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(dir, 'current.png'))
  await sharp(amp, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(dir, 'diff.png'))
  return { mismatchPct: +((bad / (W * H)) * 100).toFixed(2) }
}
