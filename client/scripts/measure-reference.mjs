// Вимір геометрії елементів референсу (координати сцени 981x639): bbox яскравих штрихів у зонах.
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STAGE = { left: 22, top: 44, width: 981, height: 639 }

const { data: lum, info } = await sharp(path.join(root, '../assets/img.png'))
  .extract(STAGE)
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true })
const med = (await sharp(path.join(root, '../assets/img.png')).extract(STAGE).greyscale().median(31).raw().toBuffer())
const W = info.width

// зони в координатах сцени (з запасом)
const ZONES = {
  brandMoon: [26, 10, 34, 46],
  brandText: [60, 18, 80, 30],
  wordmark: [420, 12, 140, 44],
  langBtn: [860, 10, 100, 50],
  h1_line1: [40, 80, 300, 48],
  h1_line2: [40, 128, 300, 48],
  lead: [40, 172, 420, 130],
  btnPrimary: [40, 296, 180, 50],
  btnGhost: [200, 296, 190, 50],
  iconTarot: [100, 460, 100, 90],
  iconDreams: [330, 460, 100, 90],
  iconAstro: [555, 460, 100, 90],
  iconAssist: [780, 460, 100, 90],
  labelTarot: [100, 545, 100, 50],
  labelDreams: [270, 545, 200, 50],
  labelAstro: [500, 545, 200, 50],
  labelAssist: [730, 545, 200, 50],
}

const T = Number(process.env.T || 22)
for (const [name, [x, y, w, h]] of Object.entries(ZONES)) {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const d = Math.abs(lum[j * W + i] - med[j * W + i])
    if (d > T) {
      n++
      if (i < x0) x0 = i
      if (i > x1) x1 = i
      if (j < y0) y0 = j
      if (j > y1) y1 = j
    }
  }
  console.log(name.padEnd(12), n ? `x ${x0}..${x1} (w ${x1 - x0 + 1})  y ${y0}..${y1} (h ${y1 - y0 + 1})  px ${n}` : 'none')
}
