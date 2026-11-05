// Повний астрологічний звіт за натальною картою: огляд, кожна планета у знаку, баланс стихій і якостей, ключові
// аспекти між планетами та фаза Місяця при народженні. Усе складається з довідникових фраз трьома мовами.
import { Locale, LOCALES } from '../i18n/locale'
import { ChartPlanet, NatalChart } from './astro'
import { planetName, signName } from './text'

type T3 = [string, string, string]
const at = (t: T3, l: Locale) => t[LOCALES.indexOf(l)]
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

type Element = 'fire' | 'earth' | 'air' | 'water'
type Modality = 'cardinal' | 'fixed' | 'mutable'

const SIGN: Record<string, { element: Element; modality: Modality; traits: T3 }> = {
  Aries: { element: 'fire', modality: 'cardinal', traits: ['bold, direct, pioneering', 'сміливість, прямота, першопроходництво', 'audacia, franqueza, espíritu pionero'] },
  Taurus: { element: 'earth', modality: 'fixed', traits: ['steady, sensual, loyal', 'стабільність, чуттєвість, вірність', 'constancia, sensualidad, lealtad'] },
  Gemini: { element: 'air', modality: 'mutable', traits: ['curious, quick, communicative', 'цікавість, жвавість, комунікабельність', 'curiosidad, rapidez, comunicación'] },
  Cancer: { element: 'water', modality: 'cardinal', traits: ['caring, intuitive, protective', 'турботливість, інтуїція, захисний інстинкт', 'cuidado, intuición, instinto protector'] },
  Leo: { element: 'fire', modality: 'fixed', traits: ['warm, creative, proud', 'теплота, творчість, гідність', 'calidez, creatividad, orgullo'] },
  Virgo: { element: 'earth', modality: 'mutable', traits: ['careful, practical, helpful', 'уважність, практичність, готовність допомагати', 'cuidado, practicidad, vocación de ayuda'] },
  Libra: { element: 'air', modality: 'cardinal', traits: ['harmonious, fair, relational', 'гармонійність, справедливість, орієнтація на стосунки', 'armonía, justicia, sentido de la relación'] },
  Scorpio: { element: 'water', modality: 'fixed', traits: ['intense, deep, transformative', 'інтенсивність, глибина, здатність до трансформації', 'intensidad, profundidad, poder transformador'] },
  Sagittarius: { element: 'fire', modality: 'mutable', traits: ['free-spirited, optimistic, exploring', 'вільний дух, оптимізм, жага відкриттів', 'espíritu libre, optimismo, afán de explorar'] },
  Capricorn: { element: 'earth', modality: 'cardinal', traits: ['disciplined, ambitious, responsible', 'дисциплінованість, амбіційність, відповідальність', 'disciplina, ambición, responsabilidad'] },
  Aquarius: { element: 'air', modality: 'fixed', traits: ['original, independent, humanitarian', 'оригінальність, незалежність, гуманізм', 'originalidad, independencia, humanismo'] },
  Pisces: { element: 'water', modality: 'mutable', traits: ['dreamy, compassionate, intuitive', 'мрійливість, співчуття, інтуїція', 'ensoñación, compasión, intuición'] },
}

const THEME: Record<string, T3> = {
  Sun: ['your core identity and vitality', 'твоя основна ідентичність і життєва сила', 'tu identidad esencial y tu vitalidad'],
  Moon: ['your emotional nature and inner needs', 'твоя емоційна природа й внутрішні потреби', 'tu naturaleza emocional y tus necesidades internas'],
  Mercury: ['how you think, learn and communicate', 'як ти думаєш, вчишся й спілкуєшся', 'cómo piensas, aprendes y te comunicas'],
  Venus: ['how you love and what you value', 'як ти любиш і що цінуєш', 'cómo amas y qué valoras'],
  Mars: ['your drive and the way you act', 'твоя енергія й спосіб діяти', 'tu impulso y tu forma de actuar'],
  Jupiter: ['where you grow and find luck', 'де ти ростеш і знаходиш удачу', 'dónde creces y encuentras suerte'],
  Saturn: ['your discipline and life lessons', 'твоя дисципліна й життєві уроки', 'tu disciplina y tus lecciones de vida'],
  Uranus: ['where you break patterns and innovate', 'де ти ламаєш шаблони й оновлюєшся', 'dónde rompes patrones e innovas'],
  Neptune: ['your dreams, imagination and intuition', 'твої мрії, уява та інтуїція', 'tus sueños, imaginación e intuición'],
  Pluto: ['deep transformation and personal power', 'глибока трансформація й особиста сила', 'transformación profunda y poder personal'],
}

const ELEMENT: Record<Element, T3> = {
  fire: ['Fire dominates your chart: you run on enthusiasm, courage and initiative.', 'У твоїй карті домінує Вогонь: ти рухаєшся ентузіазмом, сміливістю та ініціативою.', 'El Fuego domina tu carta: te mueves con entusiasmo, valentía e iniciativa.'],
  earth: ['Earth dominates your chart: you value stability, practicality and tangible results.', 'У твоїй карті домінує Земля: ти цінуєш стабільність, практичність і відчутні результати.', 'La Tierra domina tu carta: valoras la estabilidad, lo práctico y los resultados tangibles.'],
  air: ['Air dominates your chart: ideas, conversation and connection are your natural habitat.', 'У твоїй карті домінує Повітря: ідеї, розмови й зв’язки — твоє природне середовище.', 'El Aire domina tu carta: las ideas, la conversación y la conexión son tu hábitat natural.'],
  water: ['Water dominates your chart: you feel deeply and read emotional currents with ease.', 'У твоїй карті домінує Вода: ти глибоко відчуваєш і легко читаєш емоційні течії.', 'El Agua domina tu carta: sientes profundamente y lees con facilidad las corrientes emocionales.'],
}

const MODALITY: Record<Modality, T3> = {
  cardinal: ['Cardinal energy leads: you start things and set direction.', 'Веде кардинальна енергія: ти починаєш справи й задаєш напрям.', 'Lidera la energía cardinal: inicias cosas y marcas el rumbo.'],
  fixed: ['Fixed energy leads: persistence, depth and staying power until the work is done.', 'Веде фіксована енергія: наполегливість, глибина й витримка, поки справу не завершено.', 'Lidera la energía fija: perseverancia, profundidad y aguante hasta terminar.'],
  mutable: ['Mutable energy leads: you adapt, learn and change course gracefully.', 'Веде мінлива енергія: адаптація, навчання й плавна зміна курсу.', 'Lidera la energía mutable: te adaptas, aprendes y cambias de rumbo con gracia.'],
}

const ASPECT = [
  { type: 'conjunction', angle: 0, orb: 8, name: ['conjunction', 'сполучення', 'conjunción'], meaning: ['they blend and amplify each other', 'вони зливаються й підсилюють одна одну', 'se fusionan y se amplifican'] },
  { type: 'sextile', angle: 60, orb: 4, name: ['sextile', 'секстиль', 'sextil'], meaning: ['they support each other with ease', 'вони легко підтримують одна одну', 'se apoyan con facilidad'] },
  { type: 'square', angle: 90, orb: 6, name: ['square', 'квадратура', 'cuadratura'], meaning: ['they create productive tension that pushes you to grow', 'вони створюють продуктивну напругу, що штовхає до зростання', 'crean una tensión productiva que te empuja a crecer'] },
  { type: 'trine', angle: 120, orb: 6, name: ['trine', 'тригон', 'trígono'], meaning: ['they flow together naturally', 'вони поєднуються природно й без зусиль', 'fluyen juntos de forma natural'] },
  { type: 'opposition', angle: 180, orb: 8, name: ['opposition', 'опозиція', 'oposición'], meaning: ['they pull in two directions and ask for balance', 'вони тягнуть у різні боки й просять балансу', 'tiran en dos direcciones y piden equilibrio'] },
] as { type: string; angle: number; orb: number; name: T3; meaning: T3 }[]

const PHASE: { name: T3; meaning: T3 }[] = [
  { name: ['New Moon', 'Новий місяць', 'Luna nueva'], meaning: ['your birth fell at the start of a cycle: instinctive, self-starting energy', 'твоє народження припало на початок циклу: інстинктивна енергія першого кроку', 'naciste al comienzo de un ciclo: energía instintiva de iniciativa'] },
  { name: ['Waxing Crescent', 'Молодий місяць', 'Luna creciente'], meaning: ['a phase of intention and growing effort', 'фаза намірів і зростаючих зусиль', 'una fase de intención y esfuerzo creciente'] },
  { name: ['First Quarter', 'Перша чверть', 'Cuarto creciente'], meaning: ['a phase of action, decisions and overcoming obstacles', 'фаза дії, рішень і подолання перешкод', 'una fase de acción, decisiones y superación de obstáculos'] },
  { name: ['Waxing Gibbous', 'Прибуваючий місяць', 'Gibosa creciente'], meaning: ['a phase of refining and perfecting', 'фаза доопрацювання й удосконалення', 'una fase de pulido y perfeccionamiento'] },
  { name: ['Full Moon', 'Повний місяць', 'Luna llena'], meaning: ['a phase of fulfilment, awareness and relationships', 'фаза повноти, усвідомлення та стосунків', 'una fase de plenitud, conciencia y relaciones'] },
  { name: ['Waning Gibbous', 'Спадний місяць', 'Gibosa menguante'], meaning: ['a phase of sharing what you have learned', 'фаза ділитися набутим досвідом', 'una fase de compartir lo aprendido'] },
  { name: ['Last Quarter', 'Остання чверть', 'Cuarto menguante'], meaning: ['a phase of release and re-evaluation', 'фаза відпускання й переоцінки', 'una fase de soltar y reevaluar'] },
  { name: ['Waning Crescent', 'Старий місяць', 'Luna menguante'], meaning: ['a phase of rest, reflection and preparing the next cycle', 'фаза спокою, роздумів і підготовки до нового циклу', 'una fase de descanso, reflexión y preparación del próximo ciclo'] },
]

// ---------- чисті розрахунки ----------
const norm = (d: number) => ((d % 360) + 360) % 360

export interface Aspect {
  a: string
  b: string
  type: string
  orb: number
}

/** Аспекти між усіма парами планет у межах орбісу, від найточніших; не більше 8. */
export function aspectsOf(planets: { name: string; longitude: number }[]): Aspect[] {
  const out: Aspect[] = []
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const diff = norm(planets[j].longitude - planets[i].longitude)
      const sep = diff > 180 ? 360 - diff : diff
      const hit = ASPECT.find((x) => Math.abs(sep - x.angle) <= x.orb)
      if (hit) out.push({ a: planets[i].name, b: planets[j].name, type: hit.type, orb: Math.abs(sep - hit.angle) })
    }
  }
  return out.sort((x, y) => x.orb - y.orb).slice(0, 8)
}

/** Номер однієї з 8 фаз Місяця (0 — новий, 4 — повний) за кутом Місяця від Сонця. */
export const moonPhaseIndex = (sunLon: number, moonLon: number) => Math.floor((norm(moonLon - sunLon) + 22.5) / 45) % 8

/** Найпоширеніше значення (за рівної кількості — перше за порядком появи). */
export function dominant<T extends string>(values: T[]): T {
  const count = new Map<T, number>()
  for (const v of values) count.set(v, (count.get(v) ?? 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

// ---------- тексти розділів ----------
interface Words {
  title: (sun: string) => string
  sections: { overview: string; planets: string; balance: string; aspects: string; phase: string; note: string }
  head: (sun: string, moon: string, asc: string | null) => string
  core: string
  asc: (sign: string, traits: string) => string
  planet: (p: string, s: string, deg: string, theme: string, traits: string) => string
  aspect: (a: string, b: string, noun: string, orb: string, meaning: string) => string
  noAspects: string
  phase: (name: string, meaning: string) => string
  note: string
}

const WORDS: Record<Locale, Words> = {
  en: {
    title: (sun) => `Natal report: ${sun} Sun`,
    sections: { overview: 'Overview', planets: 'Planets', balance: 'Elements and modalities', aspects: 'Key aspects', phase: 'Moon phase at birth', note: 'Note' },
    head: (sun, moon, asc) => `Sun in ${sun}, Moon in ${moon}${asc ? `, Ascendant in ${asc}` : ''}.`,
    core: 'Your Sun sign describes your core identity; your Moon sign, your emotional nature.',
    asc: (s, t) => `Ascendant in ${s}: how others first meet you (${t}).`,
    planet: (p, s, d, th, tr) => `${p} in ${s} (${d}°): ${th}. Qualities of the sign: ${tr}.`,
    aspect: (a, b, n, o, m) => `- ${a} – ${b}: ${n} (orb ${o}°). ${cap(m)}.`,
    noAspects: 'No tight aspects between the planets: they act mostly independently.',
    phase: (n, m) => `Moon phase at birth: ${n}, ${m}.`,
    note: 'This report is a reflective tool based on the positions of the planets at your birth, not a prediction. Birth time and place refine the Ascendant.',
  },
  uk: {
    title: (sun) => `Натальний звіт: Сонце — ${sun}`,
    sections: { overview: 'Огляд', planets: 'Планети', balance: 'Стихії та якості', aspects: 'Ключові аспекти', phase: 'Фаза Місяця при народженні', note: 'Примітка' },
    head: (sun, moon, asc) => `Сонце: ${sun}, Місяць: ${moon}${asc ? `, Асцендент: ${asc}` : ''}.`,
    core: 'Знак Сонця описує твою основну ідентичність, знак Місяця — твою емоційну природу.',
    asc: (s, t) => `Асцендент: ${s}. Так тебе сприймають за першого знайомства (${t}).`,
    planet: (p, s, d, th, tr) => `${p} — ${s} (${d}°): ${th}. Риси знака: ${tr}.`,
    aspect: (a, b, n, o, m) => `- ${a} – ${b}: ${n} (орбіс ${o}°). ${cap(m)}.`,
    noAspects: 'Щільних аспектів між планетами немає: вони діють здебільшого незалежно.',
    phase: (n, m) => `Фаза Місяця при народженні: ${n}, ${m}.`,
    note: 'Цей звіт — інструмент для роздумів на основі положень планет у момент народження, а не передбачення. Час і місце народження уточнюють Асцендент.',
  },
  es: {
    title: (sun) => `Informe natal: Sol en ${sun}`,
    sections: { overview: 'Resumen', planets: 'Planetas', balance: 'Elementos y modalidades', aspects: 'Aspectos clave', phase: 'Fase lunar al nacer', note: 'Nota' },
    head: (sun, moon, asc) => `Sol en ${sun}, Luna en ${moon}${asc ? `, Ascendente en ${asc}` : ''}.`,
    core: 'Tu signo solar describe tu identidad esencial; tu signo lunar, tu naturaleza emocional.',
    asc: (s, t) => `Ascendente en ${s}: cómo te perciben al conocerte (${t}).`,
    planet: (p, s, d, th, tr) => `${p} en ${s} (${d}°): ${th}. Rasgos del signo: ${tr}.`,
    aspect: (a, b, n, o, m) => `- ${a} – ${b}: ${n} (orbe ${o}°). ${cap(m)}.`,
    noAspects: 'No hay aspectos cerrados entre los planetas: actúan sobre todo de forma independiente.',
    phase: (n, m) => `Fase lunar al nacer: ${n}, ${m}.`,
    note: 'Este informe es una herramienta de reflexión basada en las posiciones de los planetas al nacer, no una predicción. La hora y el lugar de nacimiento afinan el Ascendente.',
  },
}

const block = (title: string, lines: string[]) => `## ${title}\n${lines.join('\n')}`

/** Повний звіт: розділи починаються з «## Назва», рядки аспектів — з «- ». */
export function buildReport(chart: NatalChart, locale: Locale): { title: string; text: string } {
  const W = WORDS[locale]
  const planet = (name: string) => chart.planets.find((p) => p.name === name) as ChartPlanet
  const sunSign = signName(planet('Sun').sign, locale)
  const asc = chart.ascendant

  const overview = [
    W.head(sunSign, signName(planet('Moon').sign, locale), asc ? signName(asc, locale) : null),
    W.core,
    ...(asc ? [W.asc(signName(asc, locale), at(SIGN[asc].traits, locale))] : []),
  ]
  const planets = chart.planets.map((p) => W.planet(planetName(p.name, locale), signName(p.sign, locale), p.degree.toFixed(0), at(THEME[p.name], locale), at(SIGN[p.sign].traits, locale)))
  const balance = [at(ELEMENT[dominant(chart.planets.map((p) => SIGN[p.sign].element))], locale), at(MODALITY[dominant(chart.planets.map((p) => SIGN[p.sign].modality))], locale)]
  const found = aspectsOf(chart.planets)
  const aspects = found.length
    ? found.map((x) => {
        const def = ASPECT.find((d) => d.type === x.type) as (typeof ASPECT)[number]
        return W.aspect(planetName(x.a, locale), planetName(x.b, locale), at(def.name, locale), x.orb.toFixed(0), at(def.meaning, locale))
      })
    : [W.noAspects]
  const phase = PHASE[moonPhaseIndex(planet('Sun').longitude, planet('Moon').longitude)]

  const S = W.sections
  return {
    title: W.title(sunSign),
    text: [block(S.overview, overview), block(S.planets, planets), block(S.balance, balance), block(S.aspects, aspects), block(S.phase, [W.phase(at(phase.name, locale), at(phase.meaning, locale))]), block(S.note, [W.note])].join('\n\n'),
  }
}
