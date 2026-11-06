// Астрологічні будинки: MC і куспіди за Плацідусом (рівні будинки від Асцендента, якщо Плацідус неможливий — полярні широти).
const HOUSES = 12
const HOUSE_ARC = 30
const FULL = 360
const HALF = 180
const QUARTER = 90
const ITERATIONS = 30
const THIRD = 1 / 3
const TWO_THIRDS = 2 / 3

const norm = (d: number) => ((d % FULL) + FULL) % FULL
const rad = (d: number) => (d * Math.PI) / HALF
const deg = (r: number) => (r * HALF) / Math.PI

/** Довгота MC (середини неба) за RAMC і нахилом екліптики. */
export const midheavenLongitude = (ramcDeg: number, obliquityDeg: number): number =>
  norm(deg(Math.atan2(Math.sin(rad(ramcDeg)), Math.cos(rad(ramcDeg)) * Math.cos(rad(obliquityDeg)))))

/**
 * Куспід Плацідуса: точка екліптики, що проходить `fraction` свого півдугового шляху від меридіана.
 * above — над горизонтом (будинки 11, 12), інакше під ним (2, 3). null, якщо дуга не існує на цій широті.
 */
function placidusCusp(ramcDeg: number, latDeg: number, obliquityDeg: number, fraction: number, above: boolean): number | null {
  const eps = rad(obliquityDeg)
  let ra = above ? ramcDeg + fraction * QUARTER : ramcDeg + HALF - fraction * QUARTER
  let lambda = 0
  for (let i = 0; i < ITERATIONS; i++) {
    lambda = Math.atan2(Math.sin(rad(ra)), Math.cos(rad(ra)) * Math.cos(eps))
    const declination = Math.asin(Math.sin(eps) * Math.sin(lambda))
    const x = -Math.tan(rad(latDeg)) * Math.tan(declination)
    if (Math.abs(x) > 1) return null
    const dayArc = deg(Math.acos(x)) // півдуга дня
    ra = above ? ramcDeg + fraction * dayArc : ramcDeg + HALF - fraction * (HALF - dayArc)
  }
  return norm(deg(lambda))
}

/** Куспіди 12 будинків (за порядком 1…12), довготи 0–360. */
export function houseCusps(ascendant: number, ramcDeg: number, latDeg: number, obliquityDeg: number): number[] {
  const mc = midheavenLongitude(ramcDeg, obliquityDeg)
  const c11 = placidusCusp(ramcDeg, latDeg, obliquityDeg, THIRD, true)
  const c12 = placidusCusp(ramcDeg, latDeg, obliquityDeg, TWO_THIRDS, true)
  const c2 = placidusCusp(ramcDeg, latDeg, obliquityDeg, TWO_THIRDS, false)
  const c3 = placidusCusp(ramcDeg, latDeg, obliquityDeg, THIRD, false)
  if (c11 === null || c12 === null || c2 === null || c3 === null) {
    return Array.from({ length: HOUSES }, (_, i) => norm(ascendant + i * HOUSE_ARC))
  }
  const first = [ascendant, c2, c3, norm(mc + HALF), norm(c11 + HALF), norm(c12 + HALF)]
  // будинки 7–12 лежать навпроти 1–6 (10-й — MC, 11-й і 12-й — куспіди Плацідуса)
  return [...first, ...first.map((c) => norm(c + HALF))]
}

/** Номер будинку (1–12), у якому лежить довгота. */
export function houseOf(longitude: number, cusps: number[]): number {
  for (let i = 0; i < HOUSES; i++) {
    const next = cusps[(i + 1) % HOUSES]
    if (norm(longitude - cusps[i]) < norm(next - cusps[i])) return i + 1
  }
  return 1
}
