// Розкид впливів і оцінок особистого прогнозу на випадкових парах «натальна карта + день» (дати народження 1940–2010, дні 2026–2027).
// Запуск: npm run build, потім node scripts/calibrate-forecast.js. Медіану (center) і розкид (sd) сум впливу вписують у CALIBRATION
// у src/astrology/forecast.ts (scale ≈ 1,3 × sd), а рядки оцінок показують, що вийшло.
const { natalChart } = require('../dist/astrology/astro')
const { planetsAt, transitHits, scoreDay, influenceOf, addDays } = require('../dist/astrology/forecast')

let seed = 424242
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const keys = ['overall', 'love', 'career', 'money', 'energy', 'mood']
const sums = Object.fromEntries(keys.map((k) => [k, []]))
const scores = Object.fromEntries(keys.map((k) => [k, []]))
for (let i = 0; i < 40; i++) {
  const date = `${1940 + Math.floor(random() * 70)}-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}`
  const natal = natalChart({ birthDate: date }).planets
  for (let d = 0; d < 120; d++) {
    const day = addDays('2026-11-01', Math.floor(random() * 500))
    const hits = transitHits(planetsAt(new Date(`${day}T12:00:00Z`)), natal)
    const score = scoreDay(hits)
    for (const k of keys) {
      sums[k].push(influenceOf(hits, k === 'overall' ? undefined : k))
      scores[k].push(k === 'overall' ? score.overall : score.spheres[k])
    }
  }
}
const q = (xs, p) => xs[Math.floor(p * (xs.length - 1))]
for (const k of keys) {
  const xs = [...sums[k]].sort((a, b) => a - b)
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length)
  const ys = [...scores[k]].sort((a, b) => a - b)
  console.log(k.padEnd(8), `center ${q(xs, 0.5).toFixed(2)} sd ${sd.toFixed(2)} | score min ${ys[0]} p5 ${q(ys, 0.05)} p25 ${q(ys, 0.25)} median ${q(ys, 0.5)} p75 ${q(ys, 0.75)} p95 ${q(ys, 0.95)} max ${ys[ys.length - 1]}`)
}
