// Класичні джерела для тлумачень: уривки з книг Алана Лео (1899 і 1920, суспільне надбання), нарізані скриптом
// scripts/build-astro-corpus.mjs у data/astrology-corpus/*.json. Для натальної карти ми вибираємо уривки про саме її положення
// й подаємо моделі як джерело: вона переказує їх сучасною мовою, а не вигадує значення з пам'яті. Немає файлів корпусу — порожній
// список, і тлумачення працює без джерел.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { Locale } from '../i18n/locale'
import { NatalChart } from './astro'
import { aspectsOf } from './report'
import { planetName, signName } from './text'

export interface Passage {
  id: string
  source: string
  title: string
  year: number
  kind: 'sign' | 'combo' | 'house' | 'aspect'
  planet: string
  sign?: string
  planet2?: string
  sign2?: string
  house?: number
  with?: string
  nature?: 'conjunction' | 'benefic' | 'adverse'
  words: number
  text: string
}

/** Вибраний уривок і про що він: ключі для підпису (planet, sign, …) беруться з самого уривка. */
export interface Pick {
  passage: Passage
  /** Англійською, для промпту: «Sun in Leo», «Sun in Leo + Moon in Taurus», «Moon in the 7th house», «Sun-Moon aspect (benefic)». */
  label: string
}

const CORPUS_DIR = path.join(__dirname, '..', '..', 'data', 'astrology-corpus')
let cached: Passage[] | null = null

/** Усі уривки з data/astrology-corpus (читається один раз); немає теки чи файл зіпсований — порожньо. */
export function loadCorpus(dir = CORPUS_DIR): Passage[] {
  if (dir === CORPUS_DIR && cached) return cached
  const all: Passage[] = []
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      try {
        const list = JSON.parse(readFileSync(path.join(dir, file), 'utf8'))
        if (Array.isArray(list)) all.push(...list)
      } catch {
        /* пошкоджений файл не повинен ламати тлумачення */
      }
    }
  }
  if (dir === CORPUS_DIR) cached = all
  return all
}

const MAX_WORDS = 90 // скільки слів одного уривка йде в промпт: цього вистачає для суті, а промпт лишається компактним
const MAX_ASPECTS = 6
const NATURE_OF: Record<string, Passage['nature']> = { conjunction: 'conjunction', trine: 'benefic', sextile: 'benefic', square: 'adverse', opposition: 'adverse' }
const PERSONAL_BODIES = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']
const HOUSE_BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`
const first = <T>(list: T[]) => list[0]

/** Уривки до натальної карти: пара Сонце+Місяць (або кожне окремо), інші планети у знаках, планети в будинках, найточніші аспекти. */
export function natalSources(chart: NatalChart, corpus: Passage[] = loadCorpus()): Pick[] {
  if (!corpus.length) return []
  const picks: Pick[] = []
  const add = (passage: Passage | undefined, label: string) => {
    if (passage && !picks.some((p) => p.passage.id === passage.id)) picks.push({ passage, label })
  }
  const [sun, moon] = chart.planets
  const named = (planet: string) => chart.planets.find((p) => p.name === planet)

  // Сонце й Місяць: найточніше — розділ про саме цю пару знаків, потім про кожне світило окремо
  const combo = corpus.find((p) => p.kind === 'combo' && p.planet === 'Sun' && p.sign === sun.sign && p.planet2 === 'Moon' && p.sign2 === moon.sign)
  add(combo, `Sun in ${sun.sign} + Moon in ${moon.sign}`)
  for (const body of [sun, moon]) add(first(corpus.filter((p) => p.kind === 'sign' && p.planet === body.name && p.sign === body.sign)), `${body.name} in ${body.sign}`)
  if (!combo) for (const body of [sun, moon]) add(corpus.filter((p) => p.kind === 'sign' && p.planet === body.name && p.sign === body.sign)[1], `${body.name} in ${body.sign}`)

  for (const name of PERSONAL_BODIES) {
    const body = named(name)
    if (body) add(first(corpus.filter((p) => p.kind === 'sign' && p.planet === name && p.sign === body.sign)), `${name} in ${body.sign}`)
  }

  // будинки лише коли відомі час і місце народження
  for (const name of HOUSE_BODIES) {
    const body = named(name)
    if (body?.house) add(first(corpus.filter((p) => p.kind === 'house' && p.planet === name && p.house === body.house)), `${name} in the ${ordinal(body.house)} house`)
  }

  let aspects = 0
  for (const x of aspectsOf(chart.planets, 14)) {
    const nature = NATURE_OF[x.type]
    if (!nature || aspects >= MAX_ASPECTS) continue
    const hit = first(corpus.filter((p) => p.kind === 'aspect' && p.nature === nature && ((p.planet === x.a && p.with === x.b) || (p.planet === x.b && p.with === x.a))))
    if (hit) {
      add(hit, `${x.a}-${x.b} aspect (${nature}${x.type === 'conjunction' ? '' : `, ${x.type}`})`)
      aspects++
    }
  }
  return picks
}

/** Початок уривка (не більше MAX_WORDS слів): цього досить, а промпт не росте. */
export const excerpt = (text: string, max = MAX_WORDS) => {
  const parts = text.split(/\s+/)
  return parts.length <= max ? text : `${parts.slice(0, max).join(' ')}…`
}

const SOURCES_TITLE: Record<Locale, string> = { en: 'Sources', uk: 'Джерела' }
const BOOKS: Record<string, string> = { 'leo-afa-1899': 'Alan Leo, Astrology for All (1899)', 'leo-key-1920': 'Alan Leo, The Key to Your Own Nativity (1920)' }

/** Для людини: з яких книг узято основу тлумачення. Складається кодом, а не моделлю, тож це завжди правда про те, що було подано. */
export function sourcesBlock(picks: Pick[], locale: Locale): string {
  if (!picks.length) return ''
  const books = [...new Set(picks.map((p) => BOOKS[p.passage.source] ?? `${p.passage.title} (${p.passage.year})`))]
  const placements = (p: Pick) => {
    const x = p.passage
    const who = planetName(x.planet, locale)
    if (x.kind === 'combo') return `${who} — ${signName(x.sign!, locale)} + ${planetName(x.planet2!, locale)} — ${signName(x.sign2!, locale)}`
    if (x.kind === 'sign') return `${who} — ${signName(x.sign!, locale)}`
    if (x.kind === 'house') return `${who}, ${locale === 'uk' ? 'будинок' : 'house'} ${x.house}`
    return `${who} — ${planetName(x.with!, locale)}`
  }
  const note =
    locale === 'uk'
      ? 'Тлумачення спирається на класичні тексти початку XX століття (суспільне надбання), переказані сучасною мовою; це не передбачення.'
      : 'The reading is based on classical early 20th century texts (public domain), retold in modern language; it is not a prediction.'
  return [`## ${SOURCES_TITLE[locale]}`, ...books.map((b) => `- ${b}`), `${locale === 'uk' ? 'Положення, для яких були джерела' : 'Placements that had a source'}: ${picks.map(placements).join('; ')}.`, note].join('\n')
}
