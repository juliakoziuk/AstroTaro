// Повний астрологічний звіт за натальною картою: огляд (асцендент, поєднання Сонця й Місяця, управитель карти),
// кожна планета у своєму знаку й будинку, будинки та кути, баланс стихій і якостей, ключові аспекти та фаза Місяця
// при народженні. Тлумачення планет і аспектів — у readings.ts та interpretation.ts, тут лише складання звіту.
import { Locale } from '../i18n/locale'
import { ChartPlanet, NatalChart, signOf } from './astro'
import { HOUSE, aspectMeaning, houseLabel, planetMeaning } from './interpretation'
import { RULER, T2, ascendantText, at, midheavenText } from './readings'
import { planetName, signName } from './text'

export type { T2 }
export { at }
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

type Element = 'fire' | 'earth' | 'air' | 'water'
type Modality = 'cardinal' | 'fixed' | 'mutable'

export const SIGN: Record<string, { element: Element; modality: Modality }> = {
  Aries: { element: 'fire', modality: 'cardinal' },
  Taurus: { element: 'earth', modality: 'fixed' },
  Gemini: { element: 'air', modality: 'mutable' },
  Cancer: { element: 'water', modality: 'cardinal' },
  Leo: { element: 'fire', modality: 'fixed' },
  Virgo: { element: 'earth', modality: 'mutable' },
  Libra: { element: 'air', modality: 'cardinal' },
  Scorpio: { element: 'water', modality: 'fixed' },
  Sagittarius: { element: 'fire', modality: 'mutable' },
  Capricorn: { element: 'earth', modality: 'cardinal' },
  Aquarius: { element: 'air', modality: 'fixed' },
  Pisces: { element: 'water', modality: 'mutable' },
}

/** Що означає кожна планета (одним реченням): для управителя карти. */
export const THEME: Record<string, T2> = {
  Sun: ['your core identity and vitality', 'твоя основна ідентичність і життєва сила'],
  Moon: ['your emotional nature and inner needs', 'твоя емоційна природа й внутрішні потреби'],
  Mercury: ['how you think, learn and communicate', 'як ти думаєш, вчишся й спілкуєшся'],
  Venus: ['how you love and what you value', 'як ти любиш і що цінуєш'],
  Mars: ['your drive and the way you act', 'твоя енергія й спосіб діяти'],
  Jupiter: ['where you grow and find luck', 'де ти ростеш і знаходиш удачу'],
  Saturn: ['your discipline and life lessons', 'твоя дисципліна й життєві уроки'],
  Uranus: ['where you break patterns and innovate', 'де ти ламаєш шаблони й оновлюєшся'],
  Neptune: ['your dreams, imagination and intuition', 'твої мрії, уява та інтуїція'],
  Pluto: ['deep transformation and personal power', 'глибока трансформація й особиста сила'],
}

const ELEMENT_NAME: Record<Element, T2> = { fire: ['Fire', 'Вогонь'], earth: ['Earth', 'Земля'], air: ['Air', 'Повітря'], water: ['Water', 'Вода'] }
const MODALITY_NAME: Record<Modality, T2> = { cardinal: ['Cardinal', 'Кардинальні'], fixed: ['Fixed', 'Фіксовані'], mutable: ['Mutable', 'Мінливі'] }

const ELEMENT: Record<Element, T2> = {
  fire: ['Fire dominates your chart: you run on enthusiasm, courage and initiative.', 'У твоїй карті домінує Вогонь: ти рухаєшся ентузіазмом, сміливістю та ініціативою.'],
  earth: ['Earth dominates your chart: you value stability, practicality and tangible results.', 'У твоїй карті домінує Земля: ти цінуєш стабільність, практичність і відчутні результати.'],
  air: ['Air dominates your chart: ideas, conversation and connection are your natural habitat.', 'У твоїй карті домінує Повітря: ідеї, розмови й зв’язки — твоє природне середовище.'],
  water: ['Water dominates your chart: you feel deeply and read emotional currents with ease.', 'У твоїй карті домінує Вода: ти глибоко відчуваєш і легко читаєш емоційні течії.'],
}

const ELEMENT_LACK: Record<Element, T2> = {
  fire: ['Fire is scarce: spontaneity, courage and a self-starting spark may need conscious cultivation.', 'Вогню мало: спонтанність, сміливість і внутрішній стартовий поштовх доводиться вирощувати свідомо.'],
  earth: ['Earth is scarce: practical routines, money and the body need deliberate attention, or plans stay in the clouds.', 'Землі мало: практичні ритуали, гроші й тіло потребують свідомої уваги, інакше плани лишаються в хмарах.'],
  air: ['Air is scarce: stepping back, talking things through and seeing a situation from outside takes effort.', 'Повітря мало: відсторонитися, проговорити ситуацію й подивитися на неї збоку вдається не без зусиль.'],
  water: ['Water is scarce: feelings may stay unspoken, so make room for emotional honesty and rest.', 'Води мало: почуття можуть лишатися невисловленими, тож залишай місце для емоційної чесності й відпочинку.'],
}

const MODALITY: Record<Modality, T2> = {
  cardinal: ['Cardinal energy leads: you start things and set direction.', 'Веде кардинальна енергія: ти починаєш справи й задаєш напрям.'],
  fixed: ['Fixed energy leads: persistence, depth and staying power until the work is done.', 'Веде фіксована енергія: наполегливість, глибина й витримка, поки справу не завершено.'],
  mutable: ['Mutable energy leads: you adapt, learn and change course gracefully.', 'Веде мінлива енергія: адаптація, навчання й плавна зміна курсу.'],
}

const BLEND: Record<'sameSign' | 'sameElement' | 'friendly' | 'tense', T2> = {
  sameSign: [
    'Your Sun and Moon share one sign: what you want and what you need point the same way, so you feel consistent and whole, though inner contrast can be missing.',
    'Сонце й Місяць у тебе в одному знаку: те, чого ти хочеш, і те, що тобі потрібно, збігаються, тож ти почуваєшся цілісно й послідовно, хоча внутрішнього контрасту може бракувати.',
  ],
  sameElement: [
    'Your Sun and Moon share an element, so they speak the same language: head and heart usually agree, and you know quickly what feels right.',
    'Сонце й Місяць у тебе в одній стихії, тож говорять однією мовою: розум і серце здебільшого згодні, і ти швидко розумієш, що для тебе правильне.',
  ],
  friendly: [
    'Your Sun and Moon sit in friendly elements: they support each other, and your outer goals and inner needs work together with little friction.',
    'Сонце й Місяць у тебе в дружніх стихіях: вони підтримують одне одного, а зовнішні цілі та внутрішні потреби працюють разом майже без тертя.',
  ],
  tense: [
    'Your Sun and Moon sit in elements that do not mix easily: what you want and what you need can pull apart, and much of your growth comes from learning to honour both.',
    'Сонце й Місяць у тебе в стихіях, що поєднуються непросто: те, чого ти хочеш, і те, що тобі потрібно, може розходитися, а значна частина зростання — це навчитися поважати обидва голоси.',
  ],
}

export const ASPECT = [
  { type: 'conjunction', angle: 0, orb: 8, name: ['conjunction', 'сполучення'] },
  { type: 'sextile', angle: 60, orb: 4, name: ['sextile', 'секстиль'] },
  { type: 'square', angle: 90, orb: 6, name: ['square', 'квадратура'] },
  { type: 'trine', angle: 120, orb: 6, name: ['trine', 'тригон'] },
  { type: 'opposition', angle: 180, orb: 8, name: ['opposition', 'опозиція'] },
] as { type: string; angle: number; orb: number; name: T2 }[]

export const PHASE: { name: T2; meaning: T2; detail: T2 }[] = [
  {
    name: ['New Moon', 'Новий місяць'],
    meaning: ['your birth fell at the start of a cycle: instinctive, self-starting energy', 'твоє народження припало на початок циклу: інстинктивна енергія першого кроку'],
    detail: ['You trust instinct and start fresh easily; your life tends to move in cycles of new beginnings.', 'Ти довіряєш інстинкту й легко починаєш з нуля; життя в тебе часто рухається циклами нових початків.'],
  },
  {
    name: ['Waxing Crescent', 'Молодий місяць'],
    meaning: ['a phase of intention and growing effort', 'фаза намірів і зростаючих зусиль'],
    detail: ['You push through inertia and keep building toward a vision, even before others can see it.', 'Ти долаєш інерцію й крок за кроком будуєш бачення, навіть коли його ще не видно іншим.'],
  },
  {
    name: ['First Quarter', 'Перша чверть'],
    meaning: ['a phase of action, decisions and overcoming obstacles', 'фаза дії, рішень і подолання перешкод'],
    detail: ['Crisis points energise you: you grow by choosing, committing and acting through resistance.', 'Моменти кризи надихають тебе: ти зростаєш, коли обираєш, береш зобов’язання й дієш крізь опір.'],
  },
  {
    name: ['Waxing Gibbous', 'Прибуваючий місяць'],
    meaning: ['a phase of refining and perfecting', 'фаза доопрацювання й удосконалення'],
    detail: ['You analyse, adjust and refine, driven by the wish to do things properly before showing them.', 'Ти аналізуєш, підлаштовуєш і вдосконалюєш, бо хочеш зробити як слід, перш ніж показати.'],
  },
  {
    name: ['Full Moon', 'Повний місяць'],
    meaning: ['a phase of fulfilment, awareness and relationships', 'фаза повноти, усвідомлення та стосунків'],
    detail: ['You see both sides clearly and feel strongly through contrast and relationship; other people become your mirror.', 'Ти ясно бачиш обидва боки й сильно відчуваєш через контраст і стосунки; інші люди стають твоїм дзеркалом.'],
  },
  {
    name: ['Waning Gibbous', 'Спадний місяць'],
    meaning: ['a phase of sharing what you have learned', 'фаза ділитися набутим досвідом'],
    detail: ['You digest experience and pass it on: teaching, mentoring and sharing come naturally.', 'Ти осмислюєш досвід і передаєш далі: навчання, наставництво й ділення знаннями даються природно.'],
  },
  {
    name: ['Last Quarter', 'Остання чверть'],
    meaning: ['a phase of release and re-evaluation', 'фаза відпускання й переоцінки'],
    detail: ['You question inherited beliefs and know how to let outdated structures go to make room for the new.', 'Ти ставиш під сумнів успадковані переконання й вмієш відпускати застаріле, щоб звільнити місце новому.'],
  },
  {
    name: ['Waning Crescent', 'Старий місяць'],
    meaning: ['a phase of rest, reflection and preparing the next cycle', 'фаза спокою, роздумів і підготовки до нового циклу'],
    detail: ['You are tuned to endings and quiet insight: rest, reflection and intuition prepare you for what comes next.', 'У тебе тонке відчуття завершень і тихого прозріння: відпочинок, роздуми й інтуїція готують до наступного.'],
  },
]

// ---------- чисті розрахунки ----------
const norm = (d: number) => ((d % 360) + 360) % 360

export interface Aspect {
  a: string
  b: string
  type: string
  orb: number
  orbMax: number // допуск цього типу аспекту: за ним орбіс уже не аспект (для яскравості ліній на колесі)
}

const REPORT_ASPECT_LIMIT = 12
/** Повільні планети: аспект між двома з них спільний для цілого покоління, тож у звіті йому віддаємо останнє місце. */
const GENERATIONAL = new Set(['Uranus', 'Neptune', 'Pluto'])
const ANGULAR_HOUSES = new Set([1, 4, 7, 10])
const ANGULAR_EMPHASIS = 4
const LACKING_MAX = 1
const EXACT_ASPECT_ORB = 1.5

/** Аспекти між усіма парами планет у межах орбісу, від найточніших; у звіті — не більше 12. */
export function aspectsOf(planets: { name: string; longitude: number }[], limit = REPORT_ASPECT_LIMIT): Aspect[] {
  const out: Aspect[] = []
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const diff = norm(planets[j].longitude - planets[i].longitude)
      const sep = diff > 180 ? 360 - diff : diff
      const hit = ASPECT.find((x) => Math.abs(sep - x.angle) <= x.orb)
      if (hit) out.push({ a: planets[i].name, b: planets[j].name, type: hit.type, orb: Math.abs(sep - hit.angle), orbMax: hit.orb })
    }
  }
  return out.sort((x, y) => x.orb - y.orb).slice(0, limit)
}

/** Номер однієї з 8 фаз Місяця (0 — новий, 4 — повний) за кутом Місяця від Сонця. */
export const moonPhaseIndex = (sunLon: number, moonLon: number) => Math.floor((norm(moonLon - sunLon) + 22.5) / 45) % 8

/** Найпоширеніше значення (за рівної кількості — перше за порядком появи). */
export function dominant<T extends string>(values: T[]): T {
  const count = new Map<T, number>()
  for (const v of values) count.set(v, (count.get(v) ?? 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

const tally = <T extends string>(keys: T[], values: T[]) => keys.map((k) => ({ key: k, n: values.filter((v) => v === k).length }))

/** Як Сонце й Місяць співвідносяться за знаками: один знак, одна стихія, дружні стихії (вогонь–повітря, земля–вода) чи ні. */
export function sunMoonRelation(sunSign: string, moonSign: string): keyof typeof BLEND {
  if (sunSign === moonSign) return 'sameSign'
  const a = SIGN[sunSign].element
  const b = SIGN[moonSign].element
  if (a === b) return 'sameElement'
  const friendly = new Set(['fire-air', 'air-fire', 'earth-water', 'water-earth'])
  return friendly.has(`${a}-${b}`) ? 'friendly' : 'tense'
}

// ---------- тексти розділів ----------
interface Words {
  title: (sun: string) => string
  sections: { overview: string; planets: string; houses: string; balance: string; aspects: string; phase: string; note: string }
  head: (sun: string, moon: string, asc: string | null) => string
  core: string
  asc: (sign: string, text: string) => string
  ruler: (planet: string, asc: string, sign: string, house: string, theme: string) => string
  planet: (p: string, s: string, d: number) => string
  mc: (sign: string, deg: number, text: string) => string
  emphasis: (house: string, theme: string, names: string) => string
  spread: string
  angular: string
  counts: (items: string) => string
  aspectsLead: string
  aspect: (a: string, b: string, noun: string, orb: string, text: string) => string
  noAspects: string
  phase: (name: string, meaning: string) => string
  note: string
}

const WORDS: Record<Locale, Words> = {
  en: {
    title: (sun) => `Natal report: ${sun} Sun`,
    sections: { overview: 'Overview', planets: 'Planets', houses: 'Houses and angles', balance: 'Elements and modalities', aspects: 'Key aspects', phase: 'Moon phase at birth', note: 'Note' },
    head: (sun, moon, asc) => `Sun in ${sun}, Moon in ${moon}${asc ? `, Ascendant in ${asc}` : ''}.`,
    core: 'The Sun shows your core identity, the Moon your emotional nature and the Ascendant the way you meet the world; read them together rather than one by one.',
    asc: (s, t) => `Ascendant in ${s}: ${t}`,
    ruler: (p, a, s, h, th) => `Chart ruler: ${p}, the planet that rules your Ascendant sign ${a}, sits in ${s}${h}. Its theme is ${th}: that thread ties your whole chart together, so read this planet’s description below as your central story.`,
    planet: (p, s, d) => `${p} in ${s} (${d}°): `,
    mc: (s, d, t) => `Midheaven in ${s} (${d}°): ${t}`,
    emphasis: (h, th, n) => `${h} (${th}) holds several planets: ${n}. This area of life is one of your main stages.`,
    spread: 'The planets are spread evenly through the houses: no single area of life dominates your chart.',
    angular: 'Many planets stand on the angles of the chart: you are action-oriented and tend to be visible in what you do.',
    counts: (i) => `Count by planets: ${i}.`,
    aspectsLead: 'Aspects are listed from the tightest to the loosest: the smaller the orb, the stronger the link.',
    aspect: (a, b, n, o, t) => `- ${a} – ${b}: ${n} (orb ${o}°). ${t}`,
    noAspects: 'No tight aspects between the planets: they act mostly independently.',
    phase: (n, m) => `Moon phase at birth: ${n}, ${m}.`,
    note: 'This report is a reflective tool based on the positions of the planets at your birth, not a prediction. Birth time and place refine the Ascendant and the houses.',
  },
  uk: {
    title: (sun) => `Натальний звіт: Сонце — ${sun}`,
    sections: { overview: 'Огляд', planets: 'Планети', houses: 'Будинки та кути', balance: 'Стихії та якості', aspects: 'Ключові аспекти', phase: 'Фаза Місяця при народженні', note: 'Примітка' },
    head: (sun, moon, asc) => `Сонце: ${sun}, Місяць: ${moon}${asc ? `, Асцендент: ${asc}` : ''}.`,
    core: 'Сонце показує твою основну ідентичність, Місяць — емоційну природу, а Асцендент — те, як ти заходиш у світ; читай їх разом, а не окремо.',
    asc: (s, t) => `Асцендент: ${s}. ${t}`,
    ruler: (p, a, s, h, th) => `Управитель карти: ${p} — планета, що править знаком твого Асцендента (${a}), — стоїть у знаку ${s}${h}. Її тема — ${th}: ця нитка пов’язує всю карту, тож читай опис цієї планети нижче як свою центральну історію.`,
    planet: (p, s, d) => `${p} — ${s} (${d}°): `,
    mc: (s, d, t) => `Середина неба: ${s} (${d}°): ${t}`,
    emphasis: (h, th, n) => `${cap(h)} (${th}) містить кілька планет: ${n}. Ця сфера життя — одна з твоїх головних сцен.`,
    spread: 'Планети рівномірно розподілені по будинках: жодна сфера життя не домінує в карті.',
    angular: 'Багато планет стоїть на кутах карти: для тебе важлива дія, і ти зазвичай на видноті в тому, що робиш.',
    counts: (i) => `Кількість планет: ${i}.`,
    aspectsLead: 'Аспекти йдуть від найточніших до слабших: чим менший орбіс, тим сильніший зв’язок.',
    aspect: (a, b, n, o, t) => `- ${a} – ${b}: ${n} (орбіс ${o}°). ${t}`,
    noAspects: 'Щільних аспектів між планетами немає: вони діють здебільшого незалежно.',
    phase: (n, m) => `Фаза Місяця при народженні: ${n}, ${m}.`,
    note: 'Цей звіт — інструмент для роздумів на основі положень планет у момент народження, а не передбачення. Час і місце народження уточнюють Асцендент і будинки.',
  },
}

const block = (title: string, lines: string[]) => `## ${title}\n${lines.join('\n')}`

/** Повний звіт: розділи починаються з «## Назва», рядки аспектів — з «- ». */
export function buildReport(chart: NatalChart, locale: Locale): { title: string; text: string } {
  const W = WORDS[locale]
  const planet = (name: string) => chart.planets.find((p) => p.name === name) as ChartPlanet
  const sun = planet('Sun')
  const moon = planet('Moon')
  const sunSign = signName(sun.sign, locale)
  const asc = chart.ascendant
  const planetsInHouse = (n: number) => chart.planets.filter((p) => p.house === n)

  const overview = [
    W.head(sunSign, signName(moon.sign, locale), asc ? signName(asc, locale) : null),
    W.core,
    ...(asc ? [W.asc(signName(asc, locale), ascendantText(asc, locale))] : []),
    at(BLEND[sunMoonRelation(sun.sign, moon.sign)], locale),
  ]
  if (asc) {
    const ruler = planet(RULER[Object.keys(SIGN).indexOf(asc)])
    const where = ruler.house ? `, ${houseLabel(ruler.house, locale)}` : ''
    overview.push(W.ruler(planetName(ruler.name, locale), signName(asc, locale), signName(ruler.sign, locale), where, at(THEME[ruler.name], locale)))
  }

  const planets = chart.planets.map((p) => W.planet(planetName(p.name, locale), signName(p.sign, locale), Math.floor(p.degree)) + planetMeaning(p, locale))

  const houses: string[] = []
  if (chart.houses && chart.midheaven != null) {
    const mc = signOf(chart.midheaven)
    houses.push(W.mc(signName(mc.sign, locale), Math.floor(mc.degree), midheavenText(mc.sign, locale)))
    const crowded = chart.houses.map((_, i) => i + 1).filter((n) => planetsInHouse(n).length >= 2)
    for (const n of crowded) houses.push(W.emphasis(houseLabel(n, locale), at(HOUSE[n - 1], locale), planetsInHouse(n).map((p) => planetName(p.name, locale)).join(', ')))
    if (!crowded.length) houses.push(W.spread)
    if (chart.planets.filter((p) => p.house && ANGULAR_HOUSES.has(p.house)).length >= ANGULAR_EMPHASIS) houses.push(W.angular)
  }

  const elements = chart.planets.map((p) => SIGN[p.sign].element)
  const modalities = chart.planets.map((p) => SIGN[p.sign].modality)
  const elementCount = tally(Object.keys(ELEMENT) as Element[], elements)
  const lacking = [...elementCount].sort((x, y) => x.n - y.n)[0]
  const balance = [
    at(ELEMENT[dominant(elements)], locale),
    ...(lacking.n <= LACKING_MAX ? [at(ELEMENT_LACK[lacking.key], locale)] : []),
    at(MODALITY[dominant(modalities)], locale),
    W.counts([...elementCount.map((c) => `${at(ELEMENT_NAME[c.key], locale)} ${c.n}`), ...tally(Object.keys(MODALITY) as Modality[], modalities).map((c) => `${at(MODALITY_NAME[c.key], locale)} ${c.n}`)].join(' · ')),
  ]

  // Спільні для покоління аспекти двох повільних планет не описують саме цю людину: ставимо їх після особистих.
  const all = aspectsOf(chart.planets, Number.POSITIVE_INFINITY)
  const generational = (x: Aspect) => GENERATIONAL.has(x.a) && GENERATIONAL.has(x.b)
  const found = [...all.filter((x) => !generational(x)), ...all.filter(generational)].slice(0, REPORT_ASPECT_LIMIT)
  // Загальне пояснення типу аспекту (що таке квадратура тощо) — лише при першій появі типу, далі тільки текст пари.
  const explained = new Set<string>()
  const aspects = found.length
    ? [
        W.aspectsLead,
        ...found.map((x) => {
          const def = ASPECT.find((d) => d.type === x.type) as (typeof ASPECT)[number]
          const first = !explained.has(x.type)
          explained.add(x.type)
          return W.aspect(planetName(x.a, locale), planetName(x.b, locale), at(def.name, locale), x.orb.toFixed(1), aspectMeaning(x, locale, first))
        }),
      ]
    : [W.noAspects]
  const phase = PHASE[moonPhaseIndex(sun.longitude, moon.longitude)]

  const S = W.sections
  return {
    title: W.title(sunSign),
    text: [
      block(S.overview, overview),
      block(S.planets, planets),
      ...(houses.length ? [block(S.houses, houses)] : []),
      block(S.balance, balance),
      block(S.aspects, aspects),
      block(S.phase, [W.phase(at(phase.name, locale), at(phase.meaning, locale)), at(phase.detail, locale)]),
      block(S.note, [W.note]),
    ].join('\n\n'),
  }
}
