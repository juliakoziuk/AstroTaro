// Астрологічні обчислення. Місяць і Сонце рахуються наближено, але узгоджено між собою;
// решта планет у натальній карті — демонстраційні (це прототип).

export const SIGNS = [
  { name: 'Овен', glyph: '♈', element: 'fire' },
  { name: 'Телець', glyph: '♉', element: 'earth' },
  { name: 'Близнюки', glyph: '♊', element: 'air' },
  { name: 'Рак', glyph: '♋', element: 'water' },
  { name: 'Лев', glyph: '♌', element: 'fire' },
  { name: 'Діва', glyph: '♍', element: 'earth' },
  { name: 'Терези', glyph: '♎', element: 'air' },
  { name: 'Скорпіон', glyph: '♏', element: 'water' },
  { name: 'Стрілець', glyph: '♐', element: 'fire' },
  { name: 'Козеріг', glyph: '♑', element: 'earth' },
  { name: 'Водолій', glyph: '♒', element: 'air' },
  { name: 'Риби', glyph: '♓', element: 'water' },
]

export const ELEMENTS = { fire: 'Вогонь', earth: 'Земля', air: 'Повітря', water: 'Вода' }

// ︎ просить браузер показати символ текстом, а не кольоровим емодзі
export const glyphOf = (sign) => sign.glyph + '︎'

const DAY = 86400000
const SYNODIC = 29.530588853
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

// частка місячного циклу: 0 — новий місяць, 0.5 — повний
export function moonPhase(date) {
  const days = (date.getTime() - REF_NEW_MOON) / DAY
  return (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC
}

export function moonInfo(date) {
  const p = moonPhase(date)
  const illumination = (1 - Math.cos(2 * Math.PI * p)) / 2
  let name
  if (p >= 0.97 || p < 0.03) name = 'Новий Місяць'
  else if (p < 0.22) name = 'Зростаючий серп'
  else if (p < 0.28) name = 'Перша чверть'
  else if (p < 0.47) name = 'Зростаючий Місяць'
  else if (p < 0.53) name = 'Повний Місяць'
  else if (p < 0.72) name = 'Спадаючий Місяць'
  else if (p < 0.78) name = 'Остання чверть'
  else name = 'Спадаючий серп'
  return { phase: p, illumination, name }
}

// наступний новий (target = 0) або повний (target = 0.5) місяць
export function nextMoon(date, target) {
  const p = moonPhase(date)
  const delta = (((target - p) % 1) + 1) % 1
  return new Date(date.getTime() + delta * SYNODIC * DAY)
}

export function daysUntil(from, to) {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / DAY))
}

export function sunLongitude(date) {
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / DAY)
  return (((dayOfYear - 80) * 360) / 365.2422 + 360) % 360
}

export const signIndex = (lon) => Math.floor((((lon % 360) + 360) % 360) / 30)

export function moonSign(date) {
  return SIGNS[signIndex(sunLongitude(date) + 360 * moonPhase(date))]
}

function mulberry32(seed) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const norm = (lon) => ((lon % 360) + 360) % 360

export function computeChart(dateStr, timeStr) {
  const date = new Date(`${dateStr}T${timeStr || '12:00'}`)
  const [h, m] = (timeStr || '12:00').split(':').map(Number)
  const hour = h + m / 60
  const sun = sunLongitude(date)
  const moon = norm(sun + 360 * moonPhase(date))
  const asc = norm(sun + (hour - 6) * 15)
  const rnd = mulberry32(Math.floor(date.getTime() / DAY))
  const planets = [
    { key: 'sun', glyph: '☉', name: 'Сонце', lon: sun },
    { key: 'moon', glyph: '☽', name: 'Місяць', lon: moon },
    { key: 'mercury', glyph: '☿', name: 'Меркурій', lon: norm(sun + rnd() * 56 - 28), demo: true },
    { key: 'venus', glyph: '♀', name: 'Венера', lon: norm(sun + rnd() * 92 - 46), demo: true },
    { key: 'mars', glyph: '♂', name: 'Марс', lon: rnd() * 360, demo: true },
    { key: 'jupiter', glyph: '♃', name: 'Юпітер', lon: rnd() * 360, demo: true },
    { key: 'saturn', glyph: '♄', name: 'Сатурн', lon: rnd() * 360, demo: true },
  ]
  const kinds = [
    { name: 'з’єднання', angle: 0, orb: 8 },
    { name: 'секстиль', angle: 60, orb: 5 },
    { name: 'квадрат', angle: 90, orb: 6 },
    { name: 'тригон', angle: 120, orb: 7 },
    { name: 'опозиція', angle: 180, orb: 8 },
  ]
  const aspects = []
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].lon - planets[j].lon) % 360
      if (diff > 180) diff = 360 - diff
      const kind = kinds.find((k) => Math.abs(diff - k.angle) <= k.orb)
      if (kind && kind.angle !== 0) aspects.push({ a: planets[i], b: planets[j], kind: kind.name, angle: kind.angle })
    }
  }
  return { planets, asc, aspects, sun: SIGNS[signIndex(sun)], moon: SIGNS[signIndex(moon)], rising: SIGNS[signIndex(asc)] }
}

const PAIR = {
  'fire-fire': 90,
  'earth-earth': 88,
  'air-air': 88,
  'water-water': 90,
  'air-fire': 84,
  'earth-water': 84,
  'earth-fire': 58,
  'air-water': 56,
  'fire-water': 46,
  'air-earth': 50,
}

export function compatibility(i, j) {
  const a = SIGNS[i].element
  const b = SIGNS[j].element
  const key = [a, b].sort().join('-')
  const base = PAIR[key] ?? 60
  const score = Math.max(30, Math.min(98, base + ((i * 7 + j * 3) % 9) - 4))
  let text
  if (score >= 80) text = 'Природна співзвучність: ви швидко знаходите спільний ритм і підсилюєте одне одного.'
  else if (score >= 62) text = 'Гарний потенціал: різниця додає цікавості, якщо вчасно проговорювати очікування.'
  else text = 'Пара вимагає уваги: ви по-різному відчуваєте темп і емоції, тож тут цінні терпіння й відверта розмова.'
  return { score, text }
}

export function formatDay(date, options = { day: 'numeric', month: 'long' }) {
  return date.toLocaleDateString('uk-UA', options)
}

// Найближчі фази Місяця (нові й повні) у хронологічному порядку
export function upcomingMoons(date, count = 4) {
  const list = []
  let t = date
  while (list.length < count) {
    const nextNew = nextMoon(t, 0)
    const nextFull = nextMoon(t, 0.5)
    const isNew = nextNew <= nextFull
    const when = isNew ? nextNew : nextFull
    list.push({ type: isNew ? 'new' : 'full', date: when })
    t = new Date(when.getTime() + 2 * DAY)
  }
  return list
}
