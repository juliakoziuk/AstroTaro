// Порівняльна картинка «макет / сторінка» для перегляду: ref зверху, current знизу.
//   node scripts/app/compare.mjs <id> [x y w h] [scale]   → scratchpad (шлях друкується)
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { root, W, H } from './common.mjs'

const [id, ...rest] = process.argv.slice(2)
const nums = rest.map(Number)
const [x, y, w, h] = nums.length >= 4 ? nums : [0, 0, W, H]
const scale = nums.length >= 5 ? nums[4] : Math.min(1, 1000 / w)
const dir = path.join(root, `node_modules/.cache/app-diff/${id}`)
const out = process.env.OUT || path.join(root, `node_modules/.cache/app-diff/${id}/compare.png`)
const crop = (f) => sharp(path.join(dir, f)).extract({ left: x, top: y, width: w, height: h }).resize(Math.round(w * scale)).png().toBuffer()
const a = await crop('reference.png')
const b = await crop('current.png')
const ww = Math.round(w * scale)
const hh = Math.round(h * scale)
fs.mkdirSync(path.dirname(out), { recursive: true })
await sharp({ create: { width: ww, height: hh * 2 + 6, channels: 3, background: '#c0392b' } }).composite([{ input: a, top: 0, left: 0 }, { input: b, top: hh + 6, left: 0 }]).png().toFile(out)
console.log(out)
