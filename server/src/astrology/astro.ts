import * as Astronomy from 'astronomy-engine'
import { localToUtc } from '../cosmos/timezone'

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
}

export interface NatalChart {
  planets: ChartPlanet[]
  ascendant: string | null
}

export function natalChart(b: BirthData): NatalChart {
  const hasPlace = b.birthTime && b.lat != null && b.lon != null
  const date = b.birthTime && b.timeZone ? localToUtc(b.birthDate, b.birthTime, b.timeZone) : new Date(`${b.birthDate}T${b.birthTime ?? '12:00'}:00Z`)
  const planets = PLANETS.map((name) => {
    const longitude = norm(longitudeOf(name, date))
    return { name, ...signOf(longitude), longitude }
  })
  let ascendant: string | null = null
  if (hasPlace) {
    const T = (Astronomy.MakeTime(date).tt) / 36525
    const obliquity = 23.4392911 - 0.0130042 * T
    const ramc = norm(Astronomy.SiderealTime(date) * 15 + (b.lon as number))
    ascendant = signOf(ascendantLongitude(ramc, b.lat as number, obliquity)).sign
  }
  return { planets, ascendant }
}

export const currentPlanets = (now = new Date()) => PLANETS.map((name) => ({ name, ...signOf(longitudeOf(name, now)) }))

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
