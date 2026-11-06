import * as Astronomy from 'astronomy-engine'
import { localToUtc } from '../cosmos/timezone'
import { houseCusps, houseOf, midheavenLongitude } from './houses'

// Реальна ефемеридна астрологія (astronomy-engine): знаки планет, асцендент, найближчі фази Місяця.
export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
export const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const

const norm = (deg: number) => ((deg % 360) + 360) % 360
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

export const signOf = (lon: number) => {
  const l = norm(lon)
  return { sign: SIGNS[Math.floor(l / 30)], degree: l % 30 }
}

/** Екліптична довгота тіла на дату (істинний екліптичний рівень дати, тобто тропічний зодіак). */
export function longitudeOf(body: (typeof PLANETS)[number], date: Date): number {
  if (body === 'Sun') return Astronomy.SunPosition(date).elon
  return Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body[body], date, true)).elon
}

/** Довгота асцендента за місцевим зоряним часом (RAMC, градуси), широтою та нахилом екліптики. */
export function ascendantLongitude(ramcDeg: number, latDeg: number, obliquityDeg: number): number {
  const ramc = rad(ramcDeg)
  const eps = rad(obliquityDeg)
  const y = Math.cos(ramc)
  const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(rad(latDeg)) * Math.sin(eps))
  return norm(deg(Math.atan2(y, x)))
}

export interface BirthData {
  birthDate: string // YYYY-MM-DD
  birthTime?: string | null // HH:mm місцевого часу (без timeZone вважається UTC; без часу — 12:00)
  timeZone?: string | null // IANA-зона місця народження
  lat?: number | null
  lon?: number | null
}

export interface ChartPlanet {
  name: string
  sign: string
  degree: number
  longitude: number // абсолютна екліптична довгота, 0–360
  retrograde: boolean
  house: number | null // 1–12, лише коли відомі час і місце народження
}

export interface NatalChart {
  planets: ChartPlanet[]
  ascendant: string | null
  ascendantLongitude: number | null
  midheaven: number | null // довгота MC
  houses: number[] | null // куспіди будинків 1–12 (Плацідус)
}

const RETROGRADE_PROBE_MS = 24 * 60 * 60 * 1000
const HALF_CIRCLE = 180
const NEVER_RETROGRADE = new Set<string>(['Sun', 'Moon'])

/** Планета рухається назад по екліптиці: довгота за добу зменшується. */
const isRetrograde = (body: (typeof PLANETS)[number], date: Date, longitude: number): boolean => {
  if (NEVER_RETROGRADE.has(body)) return false
  const shift = norm(longitudeOf(body, new Date(date.getTime() + RETROGRADE_PROBE_MS)) - longitude)
  return shift > HALF_CIRCLE
}

export function natalChart(b: BirthData): NatalChart {
  const hasPlace = b.birthTime && b.lat != null && b.lon != null
  const date = b.birthTime && b.timeZone ? localToUtc(b.birthDate, b.birthTime, b.timeZone) : new Date(`${b.birthDate}T${b.birthTime ?? '12:00'}:00Z`)
  const bodies = PLANETS.map((name) => {
    const longitude = norm(longitudeOf(name, date))
    return { name, ...signOf(longitude), longitude, retrograde: isRetrograde(name, date, longitude) }
  })
  if (!hasPlace) {
    return { planets: bodies.map((p) => ({ ...p, house: null })), ascendant: null, ascendantLongitude: null, midheaven: null, houses: null }
  }
  const T = (Astronomy.MakeTime(date).tt) / 36525
  const obliquity = 23.4392911 - 0.0130042 * T
  const ramc = norm(Astronomy.SiderealTime(date) * 15 + (b.lon as number))
  const ascLon = ascendantLongitude(ramc, b.lat as number, obliquity)
  const houses = houseCusps(ascLon, ramc, b.lat as number, obliquity)
  return {
    planets: bodies.map((p) => ({ ...p, house: houseOf(p.longitude, houses) })),
    ascendant: signOf(ascLon).sign,
    ascendantLongitude: ascLon,
    midheaven: midheavenLongitude(ramc, obliquity),
    houses,
  }
}

export const currentPlanets = (now = new Date()) =>
  PLANETS.map((name) => {
    const longitude = norm(longitudeOf(name, now))
    return { name, ...signOf(longitude), longitude }
  })

export interface MoonEvent {
  name: 'New Moon' | 'Full Moon'
  date: string // YYYY-MM-DD
}

/** Дві найближчі фази Місяця (новий / повний місяць) після вказаної дати, за зростанням дати. */
export function nextMoonEvents(from: Date): MoonEvent[] {
  const find = (phase: 0 | 180, name: MoonEvent['name']): MoonEvent => ({
    name,
    date: (Astronomy.SearchMoonPhase(phase, from, 40) as Astronomy.AstroTime).date.toISOString().slice(0, 10),
  })
  return [find(0, 'New Moon'), find(180, 'Full Moon')].sort((a, b) => a.date.localeCompare(b.date))
}
