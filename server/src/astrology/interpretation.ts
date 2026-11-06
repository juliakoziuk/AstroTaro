// Тлумачення для натальної карти: планета у знаку й будинку, ретроградність та аспекти. Тексти планет у знаках і
// аспектів лежать у readings.ts; тут вони доповнюються темою будинку та ретроградністю.
import { Locale } from '../i18n/locale'
import { ChartPlanet } from './astro'
import { T2, aspectText, at, placementText } from './readings'
import { planetName } from './text'
import type { Aspect } from './report'

export const HOUSE: T2[] = [
  ['self-image and first impressions', 'образ себе та перше враження'],
  ['money, possessions and self-worth', 'гроші, власність і самоцінність'],
  ['communication, learning and close surroundings', 'спілкування, навчання й найближче оточення'],
  ['home, family and roots', 'дім, родина та коріння'],
  ['creativity, romance and play', 'творчість, романтика й гра'],
  ['daily work, habits and health', 'щоденна робота, звички й здоров’я'],
  ['partnerships and close relationships', 'партнерство й близькі стосунки'],
  ['shared resources, intimacy and transformation', 'спільні ресурси, близькість і трансформація'],
  ['travel, beliefs and higher learning', 'подорожі, переконання й вища освіта'],
  ['career, reputation and public role', 'кар’єра, репутація та публічна роль'],
  ['friends, groups and hopes', 'друзі, спільноти й сподівання'],
  ['the subconscious, solitude and hidden things', 'підсвідомість, самотність і приховане'],
]

const RETROGRADE: T2 = ['Retrograde: this energy works inward and unfolds more slowly.', 'Ретроград: ця енергія діє всередині й розкривається повільніше.']

/** «House 6» / «6-й будинок» */
export const houseLabel = (n: number, locale: Locale) => (locale === 'uk' ? `${n}-й будинок` : `House ${n}`)

/** Тлумачення планети: текст про планету у знаку, тема будинку (якщо відомий) і ретроградність. */
export function planetMeaning(p: ChartPlanet, locale: Locale): string {
  const house = p.house ? ` ${houseLabel(p.house, locale)}: ${at(HOUSE[p.house - 1], locale)}.` : ''
  const retro = p.retrograde ? ` ${at(RETROGRADE, locale)}` : ''
  return `${placementText(p.name, p.sign, locale)}${house}${retro}`
}

/** Тлумачення аспекту: як взаємодіють теми двох планет за типом аспекту. */
export const aspectMeaning = (a: Aspect, locale: Locale, typeNote = true): string =>
  aspectText(a.a, a.b, a.type, a.orb, { a: planetName(a.a, locale), b: planetName(a.b, locale) }, locale, typeNote)
