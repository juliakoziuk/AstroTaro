// Особистий астрологічний прогноз на день, тиждень і місяць: транзити (поточне небо) до натальної карти користувача.
// Кожен день береться на полудень UTC; для планет рахуємо аспекти транзитної планети до натальних Сонця, Місяця, Меркурія, Венери,
// Марса, Юпітера й Сатурна, з яких складаються оцінки за сферами. Тексти — двома мовами (en, uk), нейтральні за родом.
import * as Astronomy from 'astronomy-engine'
import { Locale } from '../i18n/locale'
import { PLANETS, longitudeOf, signOf } from './astro'
import { ASPECT, Aspect, PHASE, T2, at, cap, moonPhaseIndex } from './report'
import { moonEventName, planetName, signName } from './text'

const FULL_CIRCLE = 360
const HALF_CIRCLE = 180
const MS_PER_DAY = 24 * 60 * 60 * 1000
const norm = (d: number) => ((d % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE

export const WEEK_DAYS = 7
export const MONTH_DAYS = 30

type P = { name: string; longitude: number }

// ---------- дати ----------
const noonUtc = (iso: string) => new Date(`${iso}T12:00:00Z`)
export const addDays = (iso: string, n: number) => new Date(noonUtc(iso).getTime() + n * MS_PER_DAY).toISOString().slice(0, 10)
const range = (start: string, days: number) => Array.from({ length: days }, (_, i) => addDays(start, i))

// ---------- транзитні аспекти ----------
/** Транзит до натальної планети: a — транзитна планета, b — натальна; valence — чи допомагає (+) чи тисне (−), від −1 до 1. */
export interface TransitHit extends Aspect {
  valence: number
}

/** Допуск транзиту в градусах: швидкі планети дають аспект і за 3°, повільні — лише поблизу точності. */
const TRANSIT_ORB: Record<string, number> = { Moon: 3, Sun: 3, Mercury: 2.5, Venus: 3, Mars: 3, Jupiter: 3, Saturn: 3, Uranus: 1.5, Neptune: 1.5, Pluto: 1.5 }
/** Скільки важить транзитна планета: Місяць пробігає знак за два дні, тож важить менше за Юпітер чи Сатурн. */
const TRANSIT_WEIGHT: Record<string, number> = { Moon: 0.6, Sun: 1, Mercury: 0.8, Venus: 1, Mars: 1, Jupiter: 1.2, Saturn: 1.2, Uranus: 1, Neptune: 1, Pluto: 1 }
const NATAL_WEIGHT: Record<string, number> = { Sun: 3, Moon: 3, Mercury: 2, Venus: 2.5, Mars: 2.5, Jupiter: 1.5, Saturn: 1.5 }
const NATAL_WEIGHT_UNIT = 3
const TARGETS = Object.keys(NATAL_WEIGHT)
const PERSONAL = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'])
const OUTER = new Set(['Uranus', 'Neptune', 'Pluto'])
const ORB_WEIGHT = 0.5 // наскільки неточність аспекту знижує його вагу

// Підібрано так, щоб випадковий аспект у середньому не тягнув ні вгору, ні вниз: злагоджені трапляються й важать порівну з напруженими
const BASE_VALENCE: Record<string, number> = { trine: 0.9, sextile: 0.6, square: -0.9, opposition: -0.8 }
/** Характер транзитної планети: `conj` — що дає сполучення, `hard` — множник напруги в квадратурі й опозиції. */
const NATURE: Record<string, { conj: number; hard: number }> = {
  Sun: { conj: 0.5, hard: 0.8 },
  Moon: { conj: 0.3, hard: 0.8 },
  Mercury: { conj: 0.3, hard: 0.9 },
  Venus: { conj: 0.9, hard: 0.5 },
  Mars: { conj: -0.3, hard: 1.2 },
  Jupiter: { conj: 1, hard: 0.5 },
  Saturn: { conj: -0.5, hard: 1.2 },
  Uranus: { conj: -0.2, hard: 1 },
  Neptune: { conj: -0.2, hard: 1 },
  Pluto: { conj: -0.3, hard: 1 },
}
const valenceOf = (transit: string, type: string) => (type === 'conjunction' ? NATURE[transit].conj : BASE_VALENCE[type] * (BASE_VALENCE[type] < 0 ? NATURE[transit].hard : 1))

export const planetsAt = (date: Date): P[] => PLANETS.map((name) => ({ name, longitude: norm(longitudeOf(name, date)) }))

/** Усі транзитні аспекти до натальних планет; повільні планети (Уран, Нептун, Плутон) чіпають лише особисті планети. */
export function transitHits(transit: P[], natal: P[], withMoon = true): TransitHit[] {
  const out: TransitHit[] = []
  for (const t of transit) {
    if (t.name === 'Moon' && !withMoon) continue
    const orbMax = TRANSIT_ORB[t.name]
    for (const n of natal) {
      if (!TARGETS.includes(n.name) || (OUTER.has(t.name) && !PERSONAL.has(n.name))) continue
      const diff = norm(n.longitude - t.longitude)
      const sep = diff > HALF_CIRCLE ? FULL_CIRCLE - diff : diff
      const hit = ASPECT.find((d) => Math.abs(sep - d.angle) <= orbMax)
      if (hit) out.push({ a: t.name, b: n.name, type: hit.type, orb: Math.abs(sep - hit.angle), orbMax, valence: valenceOf(t.name, hit.type) })
    }
  }
  return out
}

const weightOf = (h: TransitHit) => TRANSIT_WEIGHT[h.a] * (NATAL_WEIGHT[h.b] / NATAL_WEIGHT_UNIT) * (1 - (h.orb / h.orbMax) * ORB_WEIGHT)
const effectOf = (h: TransitHit) => h.valence * weightOf(h)

// ---------- сфери й оцінки ----------
export type SphereId = 'love' | 'career' | 'money' | 'energy' | 'mood'
type Bands = [high: T2, middle: T2, low: T2]
const HIGH_FROM = 65
const LOW_UNTIL = 35

const SPHERE: Record<SphereId, { name: T2; natal: string[]; texts: Bands }> = {
  love: {
    name: ['Love and relationships', 'Кохання й стосунки'],
    natal: ['Venus', 'Moon'],
    texts: [
      ['A warm, easy day for affection: good for dates, kind words and reconnecting.', 'Теплий, легкий день для ніжності: добре для побачень, лагідних слів і зближення.'],
      ['A quiet day in love: small gestures matter more than big talks.', 'Спокійний день у коханні: маленькі жести важливіші за великі розмови.'],
      ['Feelings may be touchy: avoid heavy conversations and take things gently.', 'Почуття можуть бути чутливими: уникай важких розмов і не поспішай.'],
    ],
  },
  career: {
    name: ['Career and work', 'Кар’єра й робота'],
    natal: ['Sun', 'Saturn', 'Mars'],
    texts: [
      ['Good momentum at work: push projects forward and ask for what you need.', 'Гарний темп у роботі: просувай справи й проси те, що потрібно.'],
      ['A steady day for work: routine tasks go well, big moves can wait.', 'Рівний робочий день: рутина йде добре, великі кроки можуть зачекати.'],
      ['Obstacles or tension at work: double-check details and avoid arguments with superiors.', 'Перешкоди чи напруга на роботі: перевіряй деталі й уникай суперечок із керівництвом.'],
    ],
  },
  money: {
    name: ['Money', 'Гроші'],
    natal: ['Venus', 'Jupiter', 'Saturn'],
    texts: [
      ['Favourable for money: good for planning, deals and sensible purchases.', 'Сприятливо для грошей: добре для планування, угод і розумних покупок.'],
      ['Neutral for money: keep to your budget.', 'Нейтрально для грошей: тримайся бюджету.'],
      ['Be careful with spending and signing deals: impulse purchases are likely to disappoint.', 'Обережно з витратами й підписанням угод: імпульсивні покупки, найімовірніше, розчарують.'],
    ],
  },
  energy: {
    name: ['Energy and health', 'Енергія й здоровʼя'],
    natal: ['Sun', 'Mars'],
    texts: [
      ['Plenty of energy and good resilience: use it for exercise and unfinished tasks.', 'Багато енергії й хороша витривалість: спрямуй її на рух і незавершені справи.'],
      ['Moderate energy: pace yourself and keep a regular routine.', 'Помірна енергія: розподіляй сили й тримай звичний ритм.'],
      ['Lower energy: rest, drink water and avoid overloading the schedule.', 'Енергії менше: відпочивай, пий воду й не перевантажуй день.'],
    ],
  },
  mood: {
    name: ['Mood and emotions', 'Настрій і емоції'],
    natal: ['Moon', 'Mercury'],
    texts: [
      ['A light, balanced mood: good for socialising and creative moments.', 'Легкий, урівноважений настрій: добре для спілкування й творчості.'],
      ['Mood is even with small swings: listen to what you feel before reacting.', 'Настрій рівний із невеликими коливаннями: прислухайся до себе, перш ніж реагувати.'],
      ['Mood can swing or feel heavy: slow down, take breaks and look after yourself.', 'Настрій може коливатися чи бути важким: пригальмуй, роби перерви й бережи себе.'],
    ],
  },
}
const SPHERE_IDS = Object.keys(SPHERE) as SphereId[]

const SCORE_MIN = 1
const SCORE_MAX = 99
const NEUTRAL = 50
const SWING = 45 // наскільки далеко від 50 може піти оцінка (50 ± 45)

/**
 * Сума впливів усіх (або лише відповідних сфері) аспектів дня. Злагоджені аспекти трапляються частіше й важать більше за
 * напружені, тож «типовий» день має додатну суму: щоб типовий день отримував близько 50, оцінка рахується від центру `center`
 * (медіана суми по випадкових днях), а `scale` — розкид суми. Їх дає scripts/calibrate-forecast.js (перерахувати при зміні ваг).
 */
const CALIBRATION: Record<'overall' | SphereId, { center: number; scale: number }> = {
  overall: { center: 0.58, scale: 1.6 },
  love: { center: 0.21, scale: 0.95 },
  career: { center: 0.26, scale: 1 },
  money: { center: 0.1, scale: 0.8 },
  energy: { center: 0.21, scale: 0.95 },
  mood: { center: 0.2, scale: 0.9 },
}
export const influenceOf = (hits: TransitHit[], sphere?: SphereId) => hits.filter((h) => !sphere || SPHERE[sphere].natal.includes(h.b)).reduce((s, h) => s + effectOf(h), 0)
const scoreOf = (sum: number, key: 'overall' | SphereId) => {
  const { center, scale } = CALIBRATION[key]
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(NEUTRAL + SWING * Math.tanh((sum - center) / scale))))
}

export interface DayScore {
  overall: number
  spheres: Record<SphereId, number>
}

/** Оцінки дня 1–99 за транзитними аспектами: загальна — за всіма, за сферами — за аспектами до відповідних натальних планет. */
export function scoreDay(hits: TransitHit[]): DayScore {
  return {
    overall: scoreOf(influenceOf(hits), 'overall'),
    spheres: Object.fromEntries(SPHERE_IDS.map((id) => [id, scoreOf(influenceOf(hits, id), id)])) as Record<SphereId, number>,
  }
}

const band = (bands: Bands, score: number, locale: Locale) => at(score >= HIGH_FROM ? bands[0] : score <= LOW_UNTIL ? bands[2] : bands[1], locale)
export const sphereText = (id: SphereId, score: number, locale: Locale) => band(SPHERE[id].texts, score, locale)

// ---------- тлумачення ----------
/** Що несе транзитна планета й до чого в тобі торкається натальна: іменникові групи для речення про аспект. */
const ENERGY: Record<string, T2> = {
  Sun: ['vitality and attention', 'життєва сила й увага'],
  Moon: ['mood and sensitivity', 'настрій і чутливість'],
  Mercury: ['news, ideas and conversations', 'новини, ідеї й розмови'],
  Venus: ['affection, pleasure and harmony', 'ніжність, задоволення й гармонія'],
  Mars: ['drive, courage and friction', 'енергія, сміливість і тертя'],
  Jupiter: ['luck, growth and generosity', 'удача, зростання й щедрість'],
  Saturn: ['responsibility, limits and lessons', 'відповідальність, межі й уроки'],
  Uranus: ['surprises and the urge to break free', 'несподіванки й потяг до свободи'],
  Neptune: ['dreams, doubt and intuition', 'мрії, сумніви й інтуїція'],
  Pluto: ['deep change and intensity', 'глибока зміна й інтенсивність'],
}
const AREA: Record<string, T2> = {
  Sun: ['your identity and confidence', 'твоя ідентичність і впевненість'],
  Moon: ['your feelings and sense of safety', 'твої почуття й відчуття безпеки'],
  Mercury: ['your thinking and communication', 'твоє мислення й спілкування'],
  Venus: ['your love life and values', 'твоє кохання й цінності'],
  Mars: ['your drive and desires', 'твоя енергія й бажання'],
  Jupiter: ['your beliefs and opportunities', 'твої переконання й можливості'],
  Saturn: ['your discipline and foundations', 'твоя дисципліна й опори'],
}
const FLAVOR: Record<'ease' | 'hard' | 'conjGood' | 'conjTense', T2> = {
  ease: ['This flows easily: a good moment to act on it.', 'Це тече легко: добрий момент діяти.'],
  hard: ['This brings friction: pace yourself and avoid rash decisions.', 'Це приносить тертя: не поспішай і уникай різких рішень.'],
  conjGood: ['This is felt strongly and supportively: a fresh start in this area.', 'Це відчувається сильно й підтримує: свіжий початок у цій сфері.'],
  conjTense: ['This is felt strongly and can be intense: a turning point, so stay flexible.', 'Це відчувається сильно й може бути напруженим: поворотний момент, тож лишайся гнучкою до змін.'],
}
const GENERIC = {
  en: (energy: string, area: string, flavor: string) => `“${cap(energy)}” meets “${area}”. ${flavor}`,
  uk: (energy: string, area: string, flavor: string) => `«${cap(energy)}» зустрічається з «${area}». ${flavor}`,
}

export type Tone = 'good' | 'hard' | 'mixed'
const TONE_LIMIT = 0.3
export const toneOf = (valence: number): Tone => (valence >= TONE_LIMIT ? 'good' : valence <= -TONE_LIMIT ? 'hard' : 'mixed')

export function hitMeaning(h: TransitHit, locale: Locale): string {
  const flavor = h.type === 'conjunction' ? (h.valence >= 0 ? FLAVOR.conjGood : FLAVOR.conjTense) : h.valence > 0 ? FLAVOR.ease : FLAVOR.hard
  return GENERIC[locale](at(ENERGY[h.a], locale), at(AREA[h.b], locale), at(flavor, locale))
}

const ASPECT_NAME: Record<string, T2> = Object.fromEntries(ASPECT.map((d) => [d.type, d.name]))

export interface HitView {
  transit: { id: string; name: string }
  natal: { id: string; name: string }
  type: string
  typeName: string
  orb: number
  tone: Tone
  meaning: string
}
const view = (h: TransitHit, locale: Locale): HitView => ({
  transit: { id: h.a, name: planetName(h.a, locale) },
  natal: { id: h.b, name: planetName(h.b, locale) },
  type: h.type,
  typeName: at(ASPECT_NAME[h.type], locale),
  orb: +h.orb.toFixed(1),
  tone: toneOf(h.valence),
  meaning: hitMeaning(h, locale),
})

const DAY_LEAD: Bands = [
  ['A supportive day: things tend to go your way, so use it.', 'Сприятливий день: усе схильне складатися на твою користь, тож скористайся цим.'],
  ['A mixed day: some doors open, others need patience.', 'Змішаний день: одні двері відкриваються, інші потребують терпіння.'],
  ['A demanding day: slow down, protect your energy and postpone big decisions.', 'Вимогливий день: пригальмуй, бережи сили й відклади великі рішення.'],
]
const WEEK_LEAD: Bands = [
  ['A supportive week overall: things move your way, so act on what matters.', 'Загалом сприятливий тиждень: усе рухається на твою користь, тож дій у важливому.'],
  ['A mixed week: alternate effort and rest, and give the strong days to important matters.', 'Змішаний тиждень: чергуй зусилля й відпочинок, а сильні дні віддай важливому.'],
  ['A demanding week: slow down, keep to the essentials and use the best days for what cannot wait.', 'Вимогливий тиждень: пригальмуй, тримайся головного, а найкращі дні віддай тому, що не можна відкласти.'],
]
const MONTH_LEAD: Bands = [
  ['A supportive month: plenty of open doors, so set your goals early.', 'Сприятливий місяць: багато відкритих дверей, тож став цілі завчасно.'],
  ['A month of mixed weather: steady progress, with a few turning points marked below.', 'Місяць зі змінною погодою: рівний поступ і кілька поворотних точок, позначених нижче.'],
  ['A demanding month: growth comes through patience, so plan buffers and protect your energy.', 'Вимогливий місяць: зростання приходить через терпіння, тож закладай запас часу й бережи сили.'],
]

// ---------- день ----------
interface DayData {
  date: string
  hits: TransitHit[]
  score: DayScore
  moonSign: string
  moonLongitude: number
  sunLongitude: number
}

function dayData(date: string, natal: P[], withMoon = true): DayData {
  const planets = planetsAt(noonUtc(date))
  const moon = planets.find((p) => p.name === 'Moon') as P
  const sun = planets.find((p) => p.name === 'Sun') as P
  const hits = transitHits(planets, natal, withMoon)
  return { date, hits, score: scoreDay(hits), moonSign: signOf(moon.longitude).sign, moonLongitude: moon.longitude, sunLongitude: sun.longitude }
}

const rank = (h: TransitHit) => Math.abs(weightOf(h)) * (1 + Math.abs(h.valence))
const extremes = (scores: Record<SphereId, number>) => {
  const sorted = [...SPHERE_IDS].sort((x, y) => scores[y] - scores[x])
  return { best: sorted[0], careful: sorted[sorted.length - 1] }
}

const sphereView = (id: SphereId, score: number, locale: Locale) => ({ id, name: at(SPHERE[id].name, locale), score, text: sphereText(id, score, locale) })

export interface DayForecast {
  date: string
  overall: number
  headline: string
  spheres: ReturnType<typeof sphereView>[]
  best: { id: SphereId; name: string }
  careful: { id: SphereId; name: string }
  moon: { sign: string; signName: string; phase: string }
  aspects: HitView[]
}

const DAY_ASPECT_LIMIT = 6

function dayForecast(d: DayData, locale: Locale): DayForecast {
  const { best, careful } = extremes(d.score.spheres)
  return {
    date: d.date,
    overall: d.score.overall,
    headline: band(DAY_LEAD, d.score.overall, locale),
    spheres: SPHERE_IDS.map((id) => sphereView(id, d.score.spheres[id], locale)),
    best: { id: best, name: at(SPHERE[best].name, locale) },
    careful: { id: careful, name: at(SPHERE[careful].name, locale) },
    moon: { sign: d.moonSign, signName: signName(d.moonSign, locale), phase: at(PHASE[moonPhaseIndex(d.sunLongitude, d.moonLongitude)].name, locale) },
    aspects: [...d.hits].sort((x, y) => rank(y) - rank(x)).slice(0, DAY_ASPECT_LIMIT).map((h) => view(h, locale)),
  }
}

// ---------- тиждень і місяць ----------
export interface PeriodEvent extends HitView {
  from: string
  to: string
  exact: string
}

interface Group {
  hit: TransitHit
  dates: string[]
  exact: string
}

/** Ключові транзити періоду (без Місяця, що аспектує щодня): кожен збирається за днями, точна дата — день із найменшим орбісом. */
function keyEvents(days: DayData[], limit: number, locale: Locale): PeriodEvent[] {
  const groups = new Map<string, Group>()
  for (const d of days) {
    for (const h of d.hits) {
      if (h.a === 'Moon') continue
      const key = `${h.a}|${h.b}|${h.type}`
      const g = groups.get(key)
      if (!g) groups.set(key, { hit: h, dates: [d.date], exact: d.date })
      else {
        g.dates.push(d.date)
        if (h.orb < g.hit.orb) Object.assign(g, { hit: h, exact: d.date })
      }
    }
  }
  return [...groups.values()]
    .sort((x, y) => rank(y.hit) - rank(x.hit))
    .slice(0, limit)
    .map((g) => ({ ...view(g.hit, locale), from: g.dates[0], to: g.dates[g.dates.length - 1], exact: g.exact }))
}

export interface MoonEventView {
  id: 'New Moon' | 'Full Moon'
  name: string
  date: string
  sign: string
  signName: string
  aspect: HitView | null
}

/** Новий й повний місяць у періоді: де стоїть і чи торкається натальної планети (найщільніший аспект у межах допуску Місяця). */
function moonEvents(start: string, days: number, natal: P[], locale: Locale): MoonEventView[] {
  const to = noonUtc(addDays(start, days - 1))
  const found: { id: 'New Moon' | 'Full Moon'; date: Date }[] = []
  for (const [phase, id] of [[0, 'New Moon'], [180, 'Full Moon']] as const) {
    let t = Astronomy.SearchMoonPhase(phase, noonUtc(start), days + 1)
    while (t && t.date <= new Date(to.getTime() + MS_PER_DAY / 2)) {
      found.push({ id, date: t.date })
      t = Astronomy.SearchMoonPhase(phase, new Date(t.date.getTime() + MS_PER_DAY), days + 1)
    }
  }
  return found
    .sort((x, y) => x.date.getTime() - y.date.getTime())
    .map(({ id, date }) => {
      const longitude = norm(longitudeOf('Moon', date))
      const tight = transitHits([{ name: 'Moon', longitude }], natal).sort((x, y) => x.orb - y.orb)[0]
      const sign = signOf(longitude).sign
      return { id, name: moonEventName(id, locale), date: date.toISOString().slice(0, 10), sign, signName: signName(sign, locale), aspect: tight ? view(tight, locale) : null }
    })
}

const average = (xs: number[]) => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length)

export interface PeriodForecast {
  from: string
  to: string
  overall: number
  headline: string
  days: { date: string; overall: number; moonSign: string; best: SphereId }[]
  spheres: { id: SphereId; name: string; score: number }[]
  bestDays: string[]
  hardDays: string[]
  events: PeriodEvent[]
  moonEvents: MoonEventView[]
}

const DAY_PICKS = 3
const GOOD_DAY_FROM = 55 // у «найкращі» потрапляють лише дні вище нейтрального, у «вимогливі» — лише нижче: інакше спокійний тиждень мав би «вимогливі» дні
const HARD_DAY_UNTIL = 45

function period(start: string, count: number, natal: P[], lead: Bands, eventLimit: number, locale: Locale): PeriodForecast {
  const data = range(start, count).map((date) => dayData(date, natal))
  const overall = average(data.map((d) => d.score.overall))
  const byScore = [...data].sort((x, y) => y.score.overall - x.score.overall)
  const pick = (list: DayData[], keep: (score: number) => boolean) => list.filter((d) => keep(d.score.overall)).slice(0, Math.min(DAY_PICKS, Math.floor(count / 2))).map((d) => d.date).sort()
  return {
    from: start,
    to: addDays(start, count - 1),
    overall,
    headline: band(lead, overall, locale),
    days: data.map((d) => ({ date: d.date, overall: d.score.overall, moonSign: d.moonSign, best: extremes(d.score.spheres).best })),
    spheres: SPHERE_IDS.map((id) => ({ id, name: at(SPHERE[id].name, locale), score: average(data.map((d) => d.score.spheres[id])) })),
    bestDays: pick(byScore, (score) => score >= GOOD_DAY_FROM),
    hardDays: pick([...byScore].reverse(), (score) => score <= HARD_DAY_UNTIL),
    events: keyEvents(data, eventLimit, locale),
    moonEvents: moonEvents(start, count, natal, locale),
  }
}

export interface Forecast {
  date: string
  day: DayForecast
  week: PeriodForecast
  month: PeriodForecast
}

const WEEK_EVENTS = 6
const MONTH_EVENTS = 10

/** Прогноз від дати `date` (YYYY-MM-DD): сама дата, тиждень (7 днів) і місяць (30 днів) уперед, за натальними планетами користувача. */
export function buildForecast(natal: P[], date: string, locale: Locale): Forecast {
  return {
    date,
    day: dayForecast(dayData(date, natal), locale),
    week: period(date, WEEK_DAYS, natal, WEEK_LEAD, WEEK_EVENTS, locale),
    month: period(date, MONTH_DAYS, natal, MONTH_LEAD, MONTH_EVENTS, locale),
  }
}
