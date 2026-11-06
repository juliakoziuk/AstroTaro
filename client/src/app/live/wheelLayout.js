import { FULL_CIRCLE_DEGREES, LEFT_DEGREES, MIN_PLANET_GAP_DEGREES, MINUTES_PER_DEGREE, SPREAD_PASSES, SPREAD_STEP_RATIO } from './zodiacWheel.constants.js'

/**
 * Кут SVG (за годинниковою стрілкою від осі X) для екліптичної довготи. Асцендент лежить зліва, далі зодіак іде
 * проти годинникової стрілки (як у класичній натальній карті); без Асцендента колесо починається з 0° Овна.
 */
export const angleOf = (longitude, ascendant = 0) => ((LEFT_DEGREES + ascendant - longitude) * Math.PI) / LEFT_DEGREES

/** Точка на колі радіуса r навколо центра (0, 0) для довготи. */
export const pointAt = (longitude, radius, ascendant = 0) => ({ x: Math.cos(angleOf(longitude, ascendant)) * radius, y: Math.sin(angleOf(longitude, ascendant)) * radius })

/** Градуси знака у вигляді «22°05′»: градуси за довготою в межах знака, мінути округлені. */
export function degreeLabel(degreeInSign) {
  let whole = Math.floor(degreeInSign)
  let minutes = Math.round((degreeInSign - whole) * MINUTES_PER_DEGREE)
  if (minutes === MINUTES_PER_DEGREE) [whole, minutes] = [whole + 1, 0]
  return `${whole}°${String(minutes).padStart(2, '0')}′`
}

/**
 * Планети близьких довгот накладалися б значками: розсуваємо кути показу (спільний крок між сусідами по колу),
 * справжня довгота лишається для риски та ліній аспектів.
 */
export function spreadPlanets(planets) {
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude).map((p) => ({ ...p, shown: p.longitude }))
  const last = sorted.length - 1
  if (last < 1) return sorted
  for (let pass = 0; pass < SPREAD_PASSES; pass++) {
    for (let i = 0; i <= last; i++) {
      const a = sorted[i]
      const b = sorted[i === last ? 0 : i + 1]
      const gap = (b.shown - a.shown + FULL_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES
      if (gap >= MIN_PLANET_GAP_DEGREES) continue
      const push = ((MIN_PLANET_GAP_DEGREES - gap) * SPREAD_STEP_RATIO) / 2
      a.shown -= push
      b.shown += push
    }
  }
  return sorted
}
