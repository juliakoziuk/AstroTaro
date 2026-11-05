// Виявлення рядків тексту (і дрібних елементів) на макеті: «чорнило» = піксель, що відхиляється від локального фону;
// горизонтальне розширення зливає літери й слова в рядок, вертикальне — крапки над i. Для кожного рядка — тісний bbox
// (за порогом від піку, без ореолу), вільний bbox (для маски стирання), колір чорнила й полярність.
//   node scripts/app/detect.mjs <id|all>   → scripts/app/detections/<id>.json + node_modules/.cache/app-build/<id>.det.png
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { SCREENS, W, H, root } from './common.mjs'
import { loadGraded, rawPng } from './prepare.mjs'

const T = 18 // поріг відхилення від фону (рівні яскравості)
const RX = 8 // розширення по горизонталі (px): зливає літери/слова, не зливає колонки
const RY = 2
const STRICT = 0.34 // частка піку для «тісного» bbox

/** Розширення маски на r px по осі (двопрохідне, O(W·H)). */
function dilate(mask, r, vertical) {
  const out = new Uint8Array(mask.length)
  const n = vertical ? H : W
  const m = vertical ? W : H
  for (let a = 0; a < m; a++) {
    let last = -1e9
    for (let b = 0; b < n; b++) {
      const idx = vertical ? b * W + a : a * W + b
      if (mask[idx]) last = b
      if (b - last <= r) out[idx] = 1
    }
    last = 1e9
    for (let b = n - 1; b >= 0; b--) {
      const idx = vertical ? b * W + a : a * W + b
      if (mask[idx]) last = b
      if (last - b <= r) out[idx] = 1
    }
  }
  return out
}

export async function detectLines(id) {
  const { rgb, lum, bg } = await loadGraded(id)
  const ink = new Uint8Array(W * H) // 1 = світле чорнило, 2 = темне (на світлому тлі)
  for (let i = 0; i < W * H; i++) {
    const d = lum[i] - bg[i]
    if (d > T) ink[i] = 1
    else if (d < -T && bg[i] > 110) ink[i] = 2
  }
  const lines = []
  const stack = new Int32Array(W * H)
  for (const pol of [1, 2]) {
    const m = new Uint8Array(W * H)
    for (let i = 0; i < W * H; i++) m[i] = ink[i] === pol ? 1 : 0
    const dm = dilate(dilate(m, RX, false), RY, true)
    const label = new Int32Array(W * H)
    let next = 0
    for (let s = 0; s < W * H; s++) {
      if (!dm[s] || label[s]) continue
      next++
      let sp = 0
      stack[sp++] = s
      label[s] = next
      const px = []
      while (sp) {
        const p = stack[--sp]
        if (m[p]) px.push(p)
        const x = p % W
        const y = (p / W) | 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            const xx = x + dx
            const yy = y + dy
            if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
            const q = yy * W + xx
            if (dm[q] && !label[q]) {
              label[q] = next
              stack[sp++] = q
            }
          }
        }
      }
      if (px.length < 12) continue
      const ds = px.map((p) => Math.abs(lum[p] - bg[p])).sort((a, b) => a - b)
      const peak = ds[Math.floor(ds.length * 0.9)]
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, lx0 = 1e9, ly0 = 1e9, lx1 = -1, ly1 = -1, n2 = 0
      let cr = 0, cg = 0, cb = 0, cn = 0
      for (const p of px) {
        const x = p % W
        const y = (p / W) | 0
        if (x < lx0) lx0 = x
        if (x > lx1) lx1 = x
        if (y < ly0) ly0 = y
        if (y > ly1) ly1 = y
        const d = Math.abs(lum[p] - bg[p])
        if (d >= STRICT * peak) {
          n2++
          if (x < x0) x0 = x
          if (x > x1) x1 = x
          if (y < y0) y0 = y
          if (y > y1) y1 = y
          if (d >= 0.7 * peak) {
            cr += rgb[p * 3]
            cg += rgb[p * 3 + 1]
            cb += rgb[p * 3 + 2]
            cn++
          }
        }
      }
      if (x1 < 0) continue
      const w = x1 - x0 + 1
      const h = y1 - y0 + 1
      if (w < 5 || h < 6 || h > 90 || w > 1000) continue
      const col = '#' + [cr, cg, cb].map((v) => Math.round(v / Math.max(1, cn)).toString(16).padStart(2, '0')).join('')
      lines.push({ x0, y0, x1, y1, w, h, lx0, ly0, lx1, ly1, fill: +(n2 / (w * h)).toFixed(2), color: col, pol: pol === 1 ? 'b' : 'd', peak })
    }
  }
  // порядок читання: «смуги» по 10 px за y-центром, усередині — зліва направо
  lines.sort((a, b) => Math.round((a.y0 + a.y1) / 2 / 10) - Math.round((b.y0 + b.y1) / 2 / 10) || a.x0 - b.x0)
  lines.forEach((l, i) => (l.i = i))
  return lines
}

/** Картинка-розмітка: рамки + номери (рендер у Chrome, щоб підписи були чіткими). crop = [x, y, w, h]. */
export async function annotate(id, lines, file, { crop } = {}) {
  const { rgb } = await loadGraded(id)
  const png = (await rawPng(rgb)).toString('base64')
  const { launch } = await import('../landing-diff.mjs')
  const browser = await launch()
  try {
    const page = await browser.newPage()
    const [cx, cy, cw, ch] = crop ?? [0, 0, W, H]
    await page.setViewport({ width: cw, height: ch, deviceScaleFactor: 1 })
    const boxes = lines
      .filter((l) => l.x1 >= cx && l.x0 <= cx + cw && l.y1 >= cy && l.y0 <= cy + ch)
      .map((l) => {
        const c = l.pol === 'd' ? '#ff4fd8' : '#34f5ff'
        return (
          `<div style="position:absolute;left:${l.x0 - cx}px;top:${l.y0 - cy}px;width:${l.w}px;height:${l.h}px;outline:1px solid ${c}"></div>` +
          `<div style="position:absolute;left:${l.x0 - cx}px;top:${Math.max(0, l.y0 - cy - 12)}px;font:bold 11px/12px monospace;color:#000;background:${c};padding:0 2px">${l.i}</div>`
        )
      })
      .join('')
    await page.setContent(
      `<body style="margin:0;background:#000"><div style="position:relative;width:${cw}px;height:${ch}px;overflow:hidden"><img src="data:image/png;base64,${png}" style="position:absolute;left:${-cx}px;top:${-cy}px;width:${W}px;height:${H}px">${boxes}</div></body>`,
    )
    await page.screenshot({ path: file, type: 'png' })
  } finally {
    await browser.close()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = process.argv[2] ?? 'all'
  const ids = arg === 'all' ? SCREENS.map((s) => s.id) : [arg]
  const detDir = path.join(root, 'scripts/app/detections')
  fs.mkdirSync(detDir, { recursive: true })
  for (const id of ids) {
    const lines = await detectLines(id)
    fs.writeFileSync(path.join(detDir, `${id}.json`), JSON.stringify(lines))
    await annotate(id, lines, path.join(root, `node_modules/.cache/app-build/${id}.det.png`))
    console.log(id.padEnd(10), lines.length, 'рядків/елементів')
  }
}
