// Готує фон екрана «Draw your cards» з референсу design/draw-reference.webp (1774x887): лишає сцену (арки, кришталі,
// місяць, зоряне небо по краях), а намальований інтерфейс — бічну панель і всю центральну колонку — замальовує
// фоном, бо інтерфейс на сторінці справжній. Також вирізає логотип.
//   node scripts/build-draw-scene.mjs   →   src/app/art/draw-scene.webp, draw-logo.webp
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, '../assets/design/draw-reference.webp')
const OUT = path.join(root, 'src/app/art')
const W = 1774
const H = 887
const SIDEBAR = 188 // x < 188: панель
const COL = { left: 384, right: 1374 } // центральна колонка інтерфейсу
const FEATHER = 36

// фон центру в референсі майже рівний: (3,17,28) угорі → (5,20,36) унизу
const navy = (stop) => `<stop offset="${stop}" stop-color="${stop === 0 ? 'rgb(3,17,28)' : 'rgb(5,20,36)'}"/>`
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">${navy(0)}${navy(1)}</linearGradient>
    <linearGradient id="h" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000"/><stop offset="${FEATHER / (COL.right - COL.left)}" stop-color="#fff"/>
      <stop offset="${1 - FEATHER / (COL.right - COL.left)}" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
    </linearGradient>
    <mask id="m"><rect x="${COL.left}" width="${COL.right - COL.left}" height="${H}" fill="url(#h)"/></mask>
  </defs>
  <rect x="${COL.left}" width="${COL.right - COL.left}" height="${H}" fill="url(#v)" mask="url(#m)"/>
  <rect width="${SIDEBAR}" height="${H}" fill="url(#v)"/>
</svg>`

await sharp(SRC).composite([{ input: Buffer.from(cover) }]).webp({ quality: 86 }).toFile(path.join(OUT, 'draw-scene.webp'))
await sharp(SRC).extract({ left: 36, top: 14, width: 124, height: 106 }).webp({ quality: 92 }).toFile(path.join(OUT, 'draw-logo.webp'))
console.log('draw-scene.webp, draw-logo.webp →', path.relative(root, OUT))
