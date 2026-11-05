// Кроп перебарвленого макета зі збільшенням і лінійкою координат (для точних ручних рамок box=…).
//   node scripts/app/gridcrop.mjs <id> <x> <y> <w> <h> [scale=2] [step=20]   → node_modules/.cache/app-build/<id>.grid.png
import path from 'node:path'
import { root, W, H } from './common.mjs'
import { loadGraded, rawPng } from './prepare.mjs'
import { launch } from '../landing-diff.mjs'

const [id, x, y, w, h, scale = '2', step = '20'] = process.argv.slice(2)
const [X, Y, CW, CH, S, ST] = [x, y, w, h, scale, step].map(Number)
const { rgb } = await loadGraded(id)
const png = (await rawPng(rgb)).toBase64?.() ?? (await rawPng(rgb)).toString('base64')
const ticks = []
for (let gx = Math.ceil(X / ST) * ST; gx < X + CW; gx += ST) {
  ticks.push(`<div style="position:absolute;left:${(gx - X) * S}px;top:0;width:1px;height:${CH * S}px;background:rgba(0,255,255,${gx % (ST * 5) === 0 ? 0.55 : 0.22})"></div><div style="position:absolute;left:${(gx - X) * S + 2}px;top:0;font:10px monospace;color:#0ff;background:#0008">${gx}</div>`)
}
for (let gy = Math.ceil(Y / ST) * ST; gy < Y + CH; gy += ST) {
  ticks.push(`<div style="position:absolute;top:${(gy - Y) * S}px;left:0;height:1px;width:${CW * S}px;background:rgba(255,80,220,${gy % (ST * 5) === 0 ? 0.55 : 0.22})"></div><div style="position:absolute;top:${(gy - Y) * S + 1}px;left:0;font:10px monospace;color:#f5f;background:#0008">${gy}</div>`)
}
const browser = await launch()
try {
  const page = await browser.newPage()
  await page.setViewport({ width: CW * S, height: CH * S, deviceScaleFactor: 1 })
  await page.setContent(
    `<body style="margin:0;background:#000"><div style="position:relative;width:${CW * S}px;height:${CH * S}px;overflow:hidden"><img src="data:image/png;base64,${png}" style="position:absolute;left:${-X * S}px;top:${-Y * S}px;width:${W * S}px;height:${H * S}px;image-rendering:auto">${ticks.join('')}</div></body>`,
  )
  await page.screenshot({ path: path.join(root, `node_modules/.cache/app-build/${id}.grid.png`), type: 'png' })
} finally {
  await browser.close()
}
console.log('готово', id, [X, Y, CW, CH, S])
