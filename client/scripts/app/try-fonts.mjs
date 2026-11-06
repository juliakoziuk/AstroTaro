// Перебір пар шрифтів за РЕАЛЬНОЮ схожістю на сторінці (SSIM у зонах тексту): для кожної пари збирає тексти й рахує diff.
//   node scripts/app/try-fonts.mjs "Libre Caslon Text,Crimson Text" "Source Sans 3,Signika" [id ...]
import fs from 'node:fs'
import path from 'node:path'
import { root } from './common.mjs'
import { buildAll } from './build.mjs'
import { runDiff } from './diff.mjs'

const serifs = process.argv[2].split(',')
const sanses = process.argv[3].split(',')
const ids = process.argv.slice(4)
const file = path.join(root, 'scripts/app/fonts.json')
const orig = fs.readFileSync(file, 'utf8')
const results = []
try {
  for (const se of serifs) {
    for (const sa of sanses) {
      fs.writeFileSync(file, JSON.stringify({ serif: { family: se, weights: [400, 500, 600, 700] }, sans: { family: sa, weights: [400, 500, 600, 700] } }))
      await buildAll(ids, { noPlate: true })
      const rows = await runDiff(ids, { quiet: true })
      const avg = (k) => rows.reduce((s, r) => s + r[k], 0) / rows.length
      results.push({ serif: se, sans: sa, рядки: +avg('рядки').toFixed(3), full: +avg('full').toFixed(3) })
      console.log(se.padEnd(20), sa.padEnd(16), 'рядки', avg('рядки').toFixed(3), 'full', avg('full').toFixed(3))
    }
  }
} finally {
  fs.writeFileSync(file, orig)
}
results.sort((a, b) => b.рядки - a.рядки)
console.log('\nнайкраща пара:', JSON.stringify(results[0]))
