// Готує зображення карт для сайту: cards/*.png (референси 1024x1536, по ~2,7 МБ) → src/app/art/cards/{id}.webp (512 px
// завширшки) і back.webp. Який файл — яка карта, вирішує scripts/lib/card-files.mjs. Перевернута карта — той самий
// файл, повернутий на 180° у CSS, тож другого набору картинок немає.
//   node scripts/build-cards.mjs
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mapCardFiles } from './lib/card-files.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'cards')
const OUT = path.join(root, 'src/app/art/cards')
const WIDTH = 512

const { byId, back, unmatched, duplicates } = mapCardFiles(fs.readdirSync(SRC))
if (unmatched.length || duplicates.length || Object.keys(byId).length !== 78 || !back) {
  console.error('Не вдалося зіставити файли з картами:', { unmatched, duplicates, found: Object.keys(byId).length, back })
  process.exit(1)
}

fs.mkdirSync(OUT, { recursive: true })
let bytes = 0
const save = async (file, out, width) => {
  const buf = await sharp(path.join(SRC, file)).resize({ width }).webp({ quality: 82 }).toBuffer()
  fs.writeFileSync(path.join(OUT, out), buf)
  bytes += buf.length
}
for (const [id, file] of Object.entries(byId)) await save(file, `${id}.webp`, WIDTH)
await save(back, 'back.webp', 187) // рубашка вже маленька: не збільшуємо
console.log(`78 карт і рубашка → ${path.relative(root, OUT)}, ${(bytes / 1024 / 1024).toFixed(1)} МБ`)
