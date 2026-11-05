// Inpaint для великих і малих «дір»: гармонічне продовження меж (Лаплас) на піраміді + перенесення зерна.
// Для тонкого тексту на гладкому фоні вистачає одного рівня; для «дірки» розміром у картку (600x800 px) потрібна піраміда:
// без неї релаксація не доходить до середини й виходить «цибулинний» візерунок.
import sharp from 'sharp'

export function dilateMask(m, W, H, r) {
  const out = new Uint8Array(m.length)
  const offs = []
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) offs.push([i, j])
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!m[y * W + x]) continue
    for (const [i, j] of offs) {
      const xx = x + i
      const yy = y + j
      if (xx >= 0 && yy >= 0 && xx < W && yy < H) out[yy * W + xx] = 1
    }
  }
  return out
}

function gaussSeidel(img, known, W, H, idx, iters) {
  for (let it = 0; it < iters; it++) {
    for (const p of idx) {
      const x = p % W
      const y = (p / W) | 0
      const l = x > 0 ? p - 1 : p
      const r = x < W - 1 ? p + 1 : p
      const u = y > 0 ? p - W : p
      const d = y < H - 1 ? p + W : p
      for (let c = 0; c < 3; c++) img[p * 3 + c] = 0.25 * (img[l * 3 + c] + img[r * 3 + c] + img[u * 3 + c] + img[d * 3 + c])
    }
  }
}

function onionFill(img, known, W, H, idx) {
  const k = Uint8Array.from(known)
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
        if (k[q]) {
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
      k[p] = 1
    }
    frontier = next
  }
}

/** Заповнює mask (1 = невідомо) в RGB-буфері. Повертає новий Buffer. Зерно додається окремо (addGrain). */
export function harmonicFill(rgb, W, H, mask) {
  // піраміда
  const levels = []
  let img = new Float32Array(W * H * 3)
  for (let i = 0; i < img.length; i++) img[i] = rgb[i]
  let known = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) known[i] = mask[i] ? 0 : 1
  levels.push({ W, H, img, known })
  while (Math.min(levels.at(-1).W, levels.at(-1).H) > 28 && levels.length < 9) {
    const { W: w, H: h, img: a, known: kn } = levels.at(-1)
    const w2 = Math.ceil(w / 2)
    const h2 = Math.ceil(h / 2)
    const b = new Float32Array(w2 * h2 * 3)
    const k2 = new Uint8Array(w2 * h2)
    for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
      let n = 0
      const acc = [0, 0, 0]
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        const xx = Math.min(w - 1, x * 2 + i)
        const yy = Math.min(h - 1, y * 2 + j)
        const q = yy * w + xx
        if (kn[q]) {
          n++
          for (let c = 0; c < 3; c++) acc[c] += a[q * 3 + c]
        }
      }
      if (n === 4) {
        k2[y * w2 + x] = 1
        for (let c = 0; c < 3; c++) b[(y * w2 + x) * 3 + c] = acc[c] / 4
      }
    }
    levels.push({ W: w2, H: h2, img: b, known: k2 })
  }
  // від найгрубішого до найтоншого
  for (let l = levels.length - 1; l >= 0; l--) {
    const L = levels[l]
    const idx = []
    for (let i = 0; i < L.W * L.H; i++) if (!L.known[i]) idx.push(i)
    if (!idx.length) continue
    if (l === levels.length - 1) {
      onionFill(L.img, L.known, L.W, L.H, idx)
      gaussSeidel(L.img, L.known, L.W, L.H, idx, 300)
    } else {
      const C = levels[l + 1]
      // початкове значення — білінійна вибірка з грубшого рівня
      for (const p of idx) {
        const x = p % L.W
        const y = (p / L.W) | 0
        const fx = Math.min(C.W - 1, Math.max(0, (x + 0.5) / 2 - 0.5))
        const fy = Math.min(C.H - 1, Math.max(0, (y + 0.5) / 2 - 0.5))
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const x1 = Math.min(C.W - 1, x0 + 1)
        const y1 = Math.min(C.H - 1, y0 + 1)
        const tx = fx - x0
        const ty = fy - y0
        for (let c = 0; c < 3; c++) {
          const v00 = C.img[(y0 * C.W + x0) * 3 + c]
          const v10 = C.img[(y0 * C.W + x1) * 3 + c]
          const v01 = C.img[(y1 * C.W + x0) * 3 + c]
          const v11 = C.img[(y1 * C.W + x1) * 3 + c]
          L.img[p * 3 + c] = (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty
        }
      }
      gaussSeidel(L.img, L.known, L.W, L.H, idx, l === 0 ? 30 : 60)
    }
  }
  const out = Buffer.alloc(W * H * 3)
  const base = levels[0].img
  for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(base[i])))
  return out
}

/**
 * Додає зерно в замасковані пікселі: плитками TILE x TILE беремо високочастотну складову (оригінал мінус розмиття)
 * із «спокійних» ділянок поза маскою. Це прибирає «пластиковий» вигляд заплаток.
 */
export async function addGrain(filled, orig, W, H, mask, { tile = 12, calm = 2.2, clamp = 5, sigma = 2.2, seed = 7 } = {}) {
  const blurredOrig = await sharp(orig, { raw: { width: W, height: H, channels: 3 } }).blur(sigma).raw().toBuffer()
  const safe = dilateMask(mask, W, H, 7)
  // інтегральне зображення активності (G-канал)
  const integral = new Float64Array((W + 1) * (H + 1))
  for (let y = 0; y < H; y++) {
    let row = 0
    for (let x = 0; x < W; x++) {
      const q = (y * W + x) * 3 + 1
      row += Math.abs(orig[q] - blurredOrig[q])
      integral[(y + 1) * (W + 1) + x + 1] = integral[y * (W + 1) + x + 1] + row
    }
  }
  const box = (x0, y0, x1, y1) => integral[y1 * (W + 1) + x1] - integral[y0 * (W + 1) + x1] - integral[y1 * (W + 1) + x0] + integral[y0 * (W + 1) + x0]
  // спокійні плитки-джерела
  const sources = []
  for (let y = 0; y + tile <= H; y += tile) for (let x = 0; x + tile <= W; x += tile) {
    let ok = true
    for (let j = 0; j < tile && ok; j += 3) for (let i = 0; i < tile; i += 3) if (safe[(y + j) * W + x + i]) { ok = false; break }
    if (!ok) continue
    if (box(x, y, x + tile, y + tile) / (tile * tile) < calm) sources.push([x, y])
  }
  const out = Buffer.from(filled)
  if (!sources.length) return out
  let s = seed >>> 0
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
  for (let ty = 0; ty < H; ty += tile) for (let tx = 0; tx < W; tx += tile) {
    let any = false
    for (let j = 0; j < tile && !any; j++) for (let i = 0; i < tile; i++) {
      if (ty + j < H && tx + i < W && mask[(ty + j) * W + tx + i]) { any = true; break }
    }
    if (!any) continue
    const [sx, sy] = sources[Math.floor(rnd() * sources.length)]
    for (let j = 0; j < tile && ty + j < H; j++) for (let i = 0; i < tile && tx + i < W; i++) {
      if (!mask[(ty + j) * W + tx + i]) continue
      const p = ((ty + j) * W + tx + i) * 3
      const q = ((sy + j) * W + sx + i) * 3
      for (let c = 0; c < 3; c++) {
        const hf = Math.max(-clamp, Math.min(clamp, orig[q + c] - blurredOrig[q + c]))
        out[p + c] = Math.max(0, Math.min(255, Math.round(filled[p + c] + hf)))
      }
    }
  }
  return out
}
