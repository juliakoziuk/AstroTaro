// 2x-плити для екранів застосунку: src/app/art/<id>.webp -> <id>-2x.webp.
// Lanczos3 + різкість дрібних деталей (малий радіус) + локальний контраст (великий радіус), щоб золоті лінії й листя були чіткими.
// Запуск: node scripts/app/plate2x.mjs [id ...]   (без аргументів — усі плити)
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const DIR = 'src/app/art'
const ids = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readdirSync(DIR).filter((f) => f.endsWith('.webp') && !f.endsWith('-2x.webp')).map((f) => f.replace('.webp', ''))

for (const id of ids) {
  const src = path.join(DIR, `${id}.webp`)
  const { width, height } = await sharp(src).metadata()
  const big = await sharp(src).resize(width * 2, height * 2, { kernel: 'lanczos3' }).removeAlpha().png().toBuffer()
  const out = await sharp(big)
    .sharpen({ sigma: 1.1, m1: 1.2, m2: 2.4, x1: 2, y2: 12, y3: 14 }) // дрібні деталі
    .sharpen({ sigma: 6, m1: 0.5, m2: 0.5 }) // локальний контраст
    .modulate({ brightness: 1.07, saturation: 1.15 }) // жвавіше й яскравіше
    .webp({ quality: 96, smartSubsample: true, effort: 6 })
    .toBuffer()
  fs.writeFileSync(path.join(DIR, `${id}-2x.webp`), out)
  console.log(id, (out.length / 1024).toFixed(0), 'KB')
}
