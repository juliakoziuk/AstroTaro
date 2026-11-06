// Процедурні генератори векторних орнаментів (детерміновані — один seed дає одну форму).

export const rng = (seed) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const f = (n) => Math.round(n * 10) / 10
const rad = (d) => (d * Math.PI) / 180

/** Листок: контур, світла половина, жилка. ang — напрям кінчика в градусах. */
export function leaf(x, y, len, wid, ang) {
  const c = Math.cos(rad(ang))
  const s = Math.sin(rad(ang))
  const p = (u, v) => `${f(x + u * c - v * s)} ${f(y + u * s + v * c)}`
  const top = `C${p(len * 0.25, -wid)} ${p(len * 0.7, -wid * 0.85)} ${p(len, 0)}`
  return {
    body: `M${p(0, 0)}${top}C${p(len * 0.7, wid * 0.85)} ${p(len * 0.25, wid)} ${p(0, 0)}Z`,
    half: `M${p(0, 0)}${top}L${p(len * 0.04, 0)}Z`,
    vein: `M${p(len * 0.04, 0)}L${p(len * 0.88, 0)}`,
  }
}

/** Стебло, що закручується, з листям по боках (з малим листям — папороть). */
export function vine({ x, y, ang, len, curl, seed = 1, leafLen = 13, every = 3, step = 3, spread = 52 }) {
  const r = rng(seed)
  const pts = [[x, y]]
  const leaves = []
  const n = Math.floor(len / step)
  let a = ang
  let cx = x
  let cy = y
  for (let i = 1; i <= n; i++) {
    const t = i / n
    a += curl * (0.35 + t * t * 2.4)
    cx += Math.cos(rad(a)) * step
    cy += Math.sin(rad(a)) * step
    pts.push([cx, cy])
    if (i % every === 0 && t < 0.94) {
      const side = (i / every) % 2 ? 1 : -1
      const L = leafLen * (1 - t * 0.55) * (0.8 + r() * 0.4)
      leaves.push(leaf(cx, cy, L, L * 0.4, a + side * (spread - 6 + r() * 22)))
    }
  }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('')
  return { d, leaves, end: pts[pts.length - 1] }
}

/** Розетка з пелюсток (сукулент / аканф) — від зовнішнього кільця до бутона. */
export function rosette(cx, cy, R, seed = 1) {
  const r = rng(seed)
  const out = []
  const rings = [
    { n: 11, len: R, wid: R * 0.3, off: 0 },
    { n: 9, len: R * 0.78, wid: R * 0.27, off: 14 },
    { n: 7, len: R * 0.56, wid: R * 0.24, off: 31 },
    { n: 5, len: R * 0.36, wid: R * 0.2, off: 8 },
  ]
  rings.forEach((ring) => {
    for (let i = 0; i < ring.n; i++) {
      const ang = ring.off + (360 / ring.n) * i + (r() - 0.5) * 8
      out.push(leaf(cx, cy, ring.len * (0.9 + r() * 0.2), ring.wid, ang))
    }
  })
  return out
}

/** Спіраль від зовнішнього радіуса до центру. */
export function spiral(x, y, r0, turns = 1.15, dir = 1, rot = 0) {
  const N = Math.round(turns * 30)
  const pts = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const th = rad(rot + dir * t * turns * 360)
    const rr = r0 * (1 - t * 0.9)
    pts.push(`${f(x + rr * Math.cos(th))} ${f(y + rr * Math.sin(th))}`)
  }
  return `M${pts.join('L')}`
}

/** S-подібний завиток з двох спіралей, що сходяться в початку координат. */
export function sScroll(r, turns = 1.15) {
  return [spiral(-r, 0, r, turns, 1, 0), spiral(r, 0, r, turns, 1, 180)]
}

/** Рівномірні точки вздовж ламаної: [{x,y,a}] — a напрям дотичної в градусах. */
export function sample(path, every) {
  const out = []
  let next = every
  let walked = 0
  for (let i = 1; i < path.length; i++) {
    const [x0, y0] = path[i - 1]
    const [x1, y1] = path[i]
    const dx = x1 - x0
    const dy = y1 - y0
    const L = Math.hypot(dx, dy)
    const a = (Math.atan2(dy, dx) * 180) / Math.PI
    while (next <= walked + L) {
      const d = next - walked
      out.push({ x: x0 + (dx * d) / L, y: y0 + (dy * d) / L, a })
      next += every
    }
    walked += L
  }
  return out
}

/** Точки арки: ліва колонна вгору, півколо, права колонна вниз. */
export function archPath({ cx, r, shoulder, foot, steps = 40 }) {
  const pts = [[cx - r, foot], [cx - r, shoulder]]
  for (let i = 1; i < steps; i++) {
    const th = Math.PI + (Math.PI * i) / steps
    pts.push([cx + r * Math.cos(th), shoulder + r * Math.sin(th)])
  }
  pts.push([cx + r, shoulder], [cx + r, foot])
  return pts
}
