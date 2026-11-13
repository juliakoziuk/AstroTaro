// Середні плити для звичайних моніторів: src/app/art/<id>-2x.webp (3072x2048, ≈1 МБ) → <id>-1920.webp (1920x1280, ≈0,3 МБ).
// Вікно шириною до 1920 фізичних пікселів не потребує 2x: плита втричі легша, декодується вдвічі-втричі швидше й менше вантажить
// сторінку при переході між екранами. Вибір плити за шириною вікна — src/app/plate.js (plateUrl).
// Запуск після node scripts/app/plate2x.mjs:  node scripts/app/plate-mid.mjs [id ...]   (без аргументів — усі екрани з великою плитою)
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const DIR = 'src/app/art'
const W = 1920
const H = 1280
// register малює арт по боках картки на повну ширину вікна, а settings — звичайна сторінка без плити: для них середня плита не потрібна
const SKIP = new Set(['register', 'settings'])
const ids = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readdirSync(DIR).filter((f) => f.endsWith('-2x.webp')).map((f) => f.replace('-2x.webp', '')).filter((id) => !SKIP.has(id))

for (const id of ids) {
  const out = path.join(DIR, `${id}-1920.webp`)
  const buf = await sharp(path.join(DIR, `${id}-2x.webp`)).resize(W, H, { kernel: 'lanczos3' }).removeAlpha().webp({ quality: 90, effort: 5 }).toBuffer()
  fs.writeFileSync(out, buf)
  console.log(id, (buf.length / 1024).toFixed(0), 'KB')
}
