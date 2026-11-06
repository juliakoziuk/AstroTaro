// Калібрування шкали сумісності: середнє й розкид «сирих» відсотків для випадкових пар (дати народження 1940–2010).
// Запуск: npm run build, потім node scripts/calibrate-synastry.js. Виведені значення вписують у CALIBRATION (src/astrology/synastry.ts).
const { natalChart } = require('../dist/astrology/astro')
const { crossAspects, rawScores, signFactors } = require('../dist/astrology/synastry')

const PAIRS = Number(process.argv[2] ?? 6000)
let seed = 20260101 // детермінований генератор: однакові результати при кожному запуску
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const randomChart = () => {
  const year = 1940 + Math.floor(random() * 70)
  const month = 1 + Math.floor(random() * 12)
  const day = 1 + Math.floor(random() * 28)
  return natalChart({ birthDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` })
}

const samples = { overall: [] }
for (let i = 0; i < PAIRS; i++) {
  const [a, b] = [randomChart(), randomChart()]
  const raw = rawScores(crossAspects(a.planets, b.planets), signFactors(a.planets, b.planets))
  samples.overall.push(raw.overall)
  for (const c of raw.categories) (samples[c.id] ??= []).push(c.raw)
}
const stats = (xs) => {
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length)
  return `{ mean: ${mean.toFixed(1)}, sd: ${sd.toFixed(1)} }`
}
for (const [key, xs] of Object.entries(samples)) console.log(`  ${key}: ${stats(xs)},`)
