// Сумісність двох людей за синастрією: аспекти між планетами однієї карти й планетами іншої, оцінки за п'ятьма сферами
// та текстовий звіт. Положення планет рахує astro.ts; тут лише порівняння двох карт. Тексти — двома мовами (en, uk),
// нейтральні за родом: до користувача й партнера звертаємося на «ви».
import { Locale } from '../i18n/locale'
import { NatalChart } from './astro'
import { ASPECT, Aspect, T2, at, cap, sunMoonRelation } from './report'
import { planetName, signName } from './text'

const FULL_CIRCLE = 360
const HALF_CIRCLE = 180
const norm = (d: number) => ((d % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE

/** Аспект між планетою першої людини (a) і планетою другої (b). */
export type CrossAspect = Aspect

/** Скільки важить планета в стосунках: світила й особисті планети важливіші за повільні. */
const WEIGHT: Record<string, number> = { Sun: 3, Moon: 3, Mercury: 2, Venus: 2.5, Mars: 2.5, Jupiter: 1.5, Saturn: 1.5, Uranus: 0.8, Neptune: 0.8, Pluto: 0.8 }
const GENERATIONAL = new Set(['Uranus', 'Neptune', 'Pluto'])
const importance = (a: string, b: string) => (WEIGHT[a] + WEIGHT[b]) / 2
const ORB_WEIGHT = 0.7 // наскільки точність аспекту знижує його вагу при сортуванні
const CHART_ASPECT_LIMIT = 14
const REPORT_ASPECT_LIMIT = 12
const TOP_PER_SIDE = 3

type P = { name: string; longitude: number }

/** Усі аспекти між двома картами (кожна планета першої з кожною планетою другої) від найважливіших; два покоління-планети між собою — не рахуємо. */
export function crossAspects(mine: P[], theirs: P[], limit = Number.POSITIVE_INFINITY): CrossAspect[] {
  const found: CrossAspect[] = []
  for (const x of mine) {
    for (const y of theirs) {
      if (GENERATIONAL.has(x.name) && GENERATIONAL.has(y.name)) continue
      const diff = norm(y.longitude - x.longitude)
      const sep = diff > HALF_CIRCLE ? FULL_CIRCLE - diff : diff
      const hit = ASPECT.find((d) => Math.abs(sep - d.angle) <= d.orb)
      if (hit) found.push({ a: x.name, b: y.name, type: hit.type, orb: Math.abs(sep - hit.angle), orbMax: hit.orb })
    }
  }
  const rank = (x: CrossAspect) => (1 - (x.orb / x.orbMax) * ORB_WEIGHT) * importance(x.a, x.b)
  return found.sort((p, q) => rank(q) - rank(p)).slice(0, limit)
}

// ---------- оцінки ----------
/** Сфери життя пари. Порядок — порядок виведення: від кохання до довговічності. */
export type CategoryId = 'love' | 'attraction' | 'emotional' | 'family' | 'communication' | 'friendship' | 'money' | 'career' | 'purpose' | 'growth' | 'stability'

type Pair = { a: string; b: string }
const has = (x: Pair, ...names: string[]) => names.some((n) => x.a === n || x.b === n)
/** Пара планет складається з однієї з `p` і однієї з `q` (в будь-якому порядку; планета може бути в обох списках). */
const link = (x: Pair, p: string[], q: string[]) => (p.includes(x.a) && q.includes(x.b)) || (p.includes(x.b) && q.includes(x.a))
const LOVE_SET = ['Venus', 'Mars', 'Sun', 'Moon']
const OUTER = ['Neptune', 'Pluto', 'Uranus']

/** Тлумачення сфери за її оцінкою: висока (від 65), середня, низька (до 35). */
type Bands = [high: T2, middle: T2, low: T2]
const HIGH_FROM = 65
const LOW_UNTIL = 35

/**
 * Для кожної сфери: назва, які пари планет на неї впливають і три короткі тлумачення (висока / середня / низька оцінка).
 * Сфери частково перекриваються (Місяць важить і в емоціях, і в родині): так воно й є в синастрії.
 */
const CATEGORY: Record<CategoryId, { name: T2; match: (x: Pair) => boolean; texts: Bands }> = {
  love: {
    name: ['Love and romance', 'Любов і романтика'],
    match: (x) => link(x, ['Venus'], ['Venus', 'Moon', 'Sun', 'Jupiter', 'Neptune']),
    texts: [
      ['Affection flows easily: you appreciate each other, and romance feels natural and warm.', 'Любов тече легко: ви цінуєте одне одного, а романтика здається природною й теплою.'],
      ['Love grows with attention: the fondness is real, though you may show it differently, so say it out loud.', 'Кохання росте з увагою: симпатія справжня, хоч виявляєте ви її по-різному, тож кажіть про це вголос.'],
      ['Tenderness needs conscious effort: tastes and ways of loving differ, so learn each other’s language of love.', 'Ніжність потребує свідомих зусиль: смаки й способи кохати різні, тож вивчайте «мову кохання» одне одного.'],
    ],
  },
  attraction: {
    name: ['Intimacy and sexual chemistry', 'Інтимність і сексуальна хімія'],
    match: (x) => link(x, ['Venus', 'Mars'], ['Venus', 'Mars', 'Pluto']) || (has(x, 'Venus', 'Mars') && LOVE_SET.includes(x.a) && LOVE_SET.includes(x.b)),
    texts: [
      ['Strong physical chemistry: desire, playfulness and a comfortable rhythm of closeness.', 'Сильна фізична хімія: бажання, гра й комфортний ритм близькості.'],
      ['Attraction is there, but needs and tempo can differ: talk openly about wishes and boundaries to keep the spark.', 'Потяг є, але потреби й темп можуть різнитися: відверто говоріть про бажання й межі, щоб іскра не згасла.'],
      ['Chemistry is gentle or uneven: intimacy grows through trust and patience rather than instant fire.', 'Хімія тиха або нерівна: інтимність росте через довіру й терпіння, а не миттєвий вогонь.'],
    ],
  },
  emotional: {
    name: ['Emotional bond', 'Емоційний зв’язок'],
    match: (x) => has(x, 'Moon'),
    texts: [
      ['You feel safe with each other: moods and needs are understood without many words.', 'Поруч одне з одним безпечно: настрої й потреби зрозумілі без зайвих слів.'],
      ['Emotional understanding is good with some gaps: name your needs instead of expecting them to be guessed.', 'Емоційне порозуміння добре, але з прогалинами: називайте свої потреби, а не чекайте, що їх вгадають.'],
      ['Feelings run on different rhythms: one needs closeness when the other needs space, so agree on signals.', 'Почуття живуть різними ритмами: комусь потрібна близькість, коли іншому — простір, тож домовтеся про сигнали.'],
    ],
  },
  family: {
    name: ['Family and home', 'Родина й побут'],
    match: (x) => link(x, ['Moon'], ['Moon', 'Saturn', 'Jupiter', 'Sun']),
    texts: [
      ['A good base for home life: a shared sense of comfort, routine and caring for each other.', 'Добра основа для спільного дому: однакове відчуття затишку, ритму й турботи одне про одного.'],
      ['Home life works with some compromise: agree on routines, space and who takes care of what.', 'Побут працює з компромісами: домовтеся про ритм, простір і хто за що відповідає.'],
      ['Ideas of home and family differ: talk early about habits, roots and expectations to avoid quiet friction.', 'Уявлення про дім і родину різні: говоріть про звички, коріння й очікування завчасно, щоб уникнути тихого тертя.'],
    ],
  },
  communication: {
    name: ['Communication', 'Спілкування'],
    match: (x) => has(x, 'Mercury'),
    texts: [
      ['Easy conversation: you understand each other quickly and enjoy talking.', 'Легка розмова: ви швидко розумієте одне одного й радо спілкуєтеся.'],
      ['Communication is fine with occasional misreads: clarify before assuming.', 'Спілкування в нормі, іноді трапляються непорозуміння: уточнюйте, перш ніж припускати.'],
      ['You think and speak differently: patience and clear wording turn misunderstandings into learning.', 'Ви по-різному думаєте й говорите: терпіння й чіткі слова перетворюють непорозуміння на навчання.'],
    ],
  },
  friendship: {
    name: ['Friendship and shared interests', 'Дружба і спільні інтереси'],
    match: (x) => link(x, ['Mercury', 'Jupiter', 'Uranus'], ['Sun', 'Mercury', 'Venus', 'Jupiter', 'Uranus']),
    texts: [
      ['Great friends as well as partners: shared interests, humour and room for each other’s freedom.', 'Чудові друзі, а не лише партнери: спільні інтереси, гумор і місце для свободи одне одного.'],
      ['Friendship is solid: keep making time for shared fun and new things.', 'Дружба міцна: і далі знаходьте час на спільні радощі й нове.'],
      ['Interests and social styles differ: pick a few things you enjoy together instead of doing everything together.', 'Інтереси й манера спілкуватися з людьми різні: оберіть кілька спільних захоплень замість того, щоб робити все разом.'],
    ],
  },
  money: {
    name: ['Finances and shared resources', 'Фінанси й спільні ресурси'],
    match: (x) => link(x, ['Venus', 'Jupiter', 'Saturn'], ['Venus', 'Jupiter', 'Saturn']) || link(x, ['Mercury'], ['Jupiter', 'Saturn']),
    texts: [
      ['Shared money matters go smoothly: similar values about spending, saving and security.', 'Спільні гроші — без напруги: схожі цінності щодо витрат, заощаджень і безпеки.'],
      ['Finances are workable: set shared rules for big expenses and keep a common safety cushion.', 'З фінансами можна впоратися: встановіть спільні правила для великих витрат і тримайте спільну «подушку безпеки».'],
      ['Money habits differ: one may spend where the other saves, so agree on a budget and talk before big decisions.', 'Звички щодо грошей різні: хтось витрачає, де інший заощаджує, тож домовтеся про бюджет і говоріть перед великими рішеннями.'],
    ],
  },
  career: {
    name: ['Career and ambition', 'Кар’єра й амбіції'],
    match: (x) => link(x, ['Sun', 'Mars', 'Saturn'], ['Sun', 'Mars', 'Saturn', 'Jupiter', 'Pluto']),
    texts: [
      ['You back each other’s ambitions: drive and discipline support shared goals and projects.', 'Ви підтримуєте амбіції одне одного: енергія й дисципліна допомагають спільним цілям і проєктам.'],
      ['Ambitions are compatible: coordinate timing so that one career does not outrun the other.', 'Амбіції сумісні: узгоджуйте темп, щоб одна кар’єра не випереджала іншу.'],
      ['Work styles and goals pull apart: respect different paces and decide together what comes first.', 'Стиль роботи й цілі розходяться: поважайте різний темп і разом вирішуйте, що першочергове.'],
    ],
  },
  purpose: {
    name: ['Shared purpose and identity', 'Спільна мета та ідентичність'],
    match: (x) => has(x, 'Sun'),
    texts: [
      ['Your core identities respect each other and point in a similar direction.', 'Ваші основні «я» поважають одне одного й дивляться в схожому напрямку.'],
      ['Different goals that can complement each other if each of you keeps room to be yourself.', 'Різні цілі, що можуть доповнювати одна одну, якщо кожен має місце бути собою.'],
      ['Wills clash on direction: decide together which goals are shared and which stay personal.', 'Волі стикаються щодо напрямку: вирішіть разом, які цілі спільні, а які лишаються особистими.'],
    ],
  },
  growth: {
    name: ['Personal and spiritual growth', 'Особистий і духовний розвиток'],
    match: (x) => link(x, OUTER, ['Sun', 'Moon', 'Venus', 'Mars', 'Mercury']),
    texts: [
      ['A transformative bond: you inspire change and spiritual or creative growth in each other.', 'Зв’язок, що змінює: ви надихаєте одне одного на зміни та духовне чи творче зростання.'],
      ['Moments of deep change appear now and then: treat them as shared learning.', 'Час від часу приходять глибокі зміни: сприймайте їх як спільне навчання.'],
      ['Little deep karmic pull: the relationship grows through everyday choices rather than fate.', 'Глибокого «кармічного» зв’язку майже не видно: стосунки ростуть із щоденних виборів, а не з долі.'],
    ],
  },
  stability: {
    name: ['Stability and longevity', 'Стабільність і довговічність'],
    match: (x) => has(x, 'Saturn', 'Jupiter'),
    texts: [
      ['A lasting foundation: loyalty, reliability and room to grow together over the years.', 'Тривала основа: вірність, надійність і простір для спільного зростання роками.'],
      ['Stability is built over time: consistency and small rituals make it stronger.', 'Стабільність будується з часом: постійність і маленькі ритуали роблять її міцнішою.'],
      ['Security takes deliberate work: set shared commitments and revisit them regularly.', 'Безпека потребує свідомої праці: узгодьте спільні зобов’язання й регулярно їх переглядайте.'],
    ],
  },
}
const CATEGORY_IDS = Object.keys(CATEGORY) as CategoryId[]

/** Тлумачення сфери за оцінкою (1–100). */
export const sphereText = (id: CategoryId, score: number, locale: Locale) => {
  const [high, middle, low] = CATEGORY[id].texts
  return at(score >= HIGH_FROM ? high : score <= LOW_UNTIL ? low : middle, locale)
}

/**
 * Яка частка аспекту «працює на гармонію». Тригон і секстиль — майже повністю, сполучення — переважно (з Марсом, Сатурном та
 * повільними планетами — навпіл), квадратура й опозиція — здебільшого напруга; у парах Венера/Марс із Сонцем чи Місяцем
 * напруга ще й дає іскри, тож там частка більша.
 */
const HARMONY_SHARE: Record<string, number> = { trine: 1, sextile: 0.85, conjunction: 0.7, opposition: 0.15, square: 0.1 }
const HEAVY_CONJUNCTION = new Set(['Mars', 'Saturn', 'Uranus', 'Neptune', 'Pluto'])
const HEAVY_CONJUNCTION_SHARE = 0.5
const CHEMISTRY_SHARE: Record<string, number> = { opposition: 0.5, square: 0.45 }
const HARMONIOUS_FROM = 0.5 // з такою часткою аспект рахуємо злагодженим (для підрахунку кількості)
const SMOOTHING_ALL = 2 // «вага нейтральності»: без чинників — рівно 50%, кілька слабких чинників не дають крайніх значень
const SMOOTHING_AREA = 1
const PERCENT = 100

const isChemistry = (x: { a: string; b: string }) => has(x as CrossAspect, 'Venus', 'Mars') && LOVE_SET.includes(x.a) && LOVE_SET.includes(x.b)

export function harmonyShare(x: CrossAspect): number {
  if (x.type === 'conjunction') return HEAVY_CONJUNCTION.has(x.a) || HEAVY_CONJUNCTION.has(x.b) ? HEAVY_CONJUNCTION_SHARE : HARMONY_SHARE.conjunction
  if (isChemistry(x) && x.type in CHEMISTRY_SHARE) return CHEMISTRY_SHARE[x.type]
  return HARMONY_SHARE[x.type]
}

/** Вага аспекту: важливість планет, зменшена його неточністю (орбісом). */
export const weightOf = (x: CrossAspect) => importance(x.a, x.b) * (1 - (x.orb / x.orbMax) * ORB_WEIGHT)

/** Один чинник сумісності: пара планет, його вага й частка, що працює на гармонію (0–1). Чинники — аспекти й гармонія знаків. */
export interface Factor {
  a: string
  b: string
  weight: number
  share: number
}

const fromAspect = (x: CrossAspect): Factor => ({ a: x.a, b: x.b, weight: weightOf(x), share: harmonyShare(x) })

/**
 * Гармонія знаків ключових планет: однакові планети двох людей (Сонце–Сонце, Місяць–Місяць, Меркурій, Венера, Марс) та
 * перехресні пари Сонце–Місяць і Венера–Марс. Один знак чи одна стихія — найкраще, дружні стихії (вогонь–повітря, земля–вода) — добре,
 * непоєднувані — слабше. Вага менша за аспекти: знак описує стиль, а аспект — саме взаємодію двох карт.
 */
const SIGN_WEIGHT = 0.6
const SIGN_SHARE = { sameSign: 0.8, sameElement: 0.85, friendly: 0.7, tense: 0.25 }
const SIGN_PAIRS: [string, string][] = [['Sun', 'Sun'], ['Moon', 'Moon'], ['Mercury', 'Mercury'], ['Venus', 'Venus'], ['Mars', 'Mars'], ['Sun', 'Moon'], ['Moon', 'Sun'], ['Venus', 'Mars'], ['Mars', 'Venus']]

export function signFactors(mine: { name: string; sign: string }[], theirs: { name: string; sign: string }[]): Factor[] {
  const signOf = (planets: { name: string; sign: string }[], name: string) => (planets.find((p) => p.name === name) as { sign: string }).sign
  return SIGN_PAIRS.map(([a, b]) => ({ a, b, weight: importance(a, b) * SIGN_WEIGHT, share: SIGN_SHARE[sunMoonRelation(signOf(mine, a), signOf(theirs, b))] }))
}

/** Сира частка гармонії в сумі ваг чинників, зсунута до 50%, щоб жменя слабких чинників не давала крайніх значень (без округлення). */
function rawPercent(factors: Factor[], smoothing: number) {
  let harmony = 0
  let total = 0
  for (const f of factors) {
    harmony += f.weight * f.share
    total += f.weight
  }
  return (PERCENT * (harmony + smoothing)) / (total + 2 * smoothing)
}

/**
 * Розтягування шкали. Сирі відсотки реальних пар купчаться навколо 50 (у кожної пари приблизно половина аспектів злагоджена),
 * тож їх переносимо на шкалу 1–100 за положенням серед типових пар: середня пара — близько 50, помітно краща чи гірша — далеко
 * від 50. mean і sd — середнє й розкид сирих відсотків для випадкових пар; їх дає scripts/calibrate-synastry.js
 * (перерахувати, якщо змінюються ваги чи правила вище).
 */
const CALIBRATION: Record<'overall' | CategoryId, { mean: number; sd: number }> = {
  overall: { mean: 54.1, sd: 5.9 },
  love: { mean: 56.8, sd: 12 },
  attraction: { mean: 57, sd: 9.1 },
  emotional: { mean: 53.9, sd: 10.7 },
  family: { mean: 51.4, sd: 12.7 },
  communication: { mean: 52.8, sd: 12.7 },
  friendship: { mean: 53.1, sd: 12.6 },
  money: { mean: 52.8, sd: 12.6 },
  career: { mean: 53.5, sd: 11 },
  purpose: { mean: 54.1, sd: 11 },
  growth: { mean: 51.6, sd: 11.1 },
  stability: { mean: 52.7, sd: 11.3 },
}
const TAIL_SOFTENING = 1.2 // >1 робить розкид м'якшим: найкращі й найгірші пари не прилипають до 1 і 100
const SCORE_MIN = 1
const SCORE_MAX = 100

/** Інтеграл нормального розподілу (наближення Абрамовіца–Стегун для erf). */
function normalCdf(z: number) {
  const x = Math.abs(z) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t
  const erf = 1 - poly * Math.exp(-x * x)
  return 0.5 * (1 + Math.sign(z) * erf)
}

export function stretch(raw: number, key: keyof typeof CALIBRATION): number {
  const { mean, sd } = CALIBRATION[key]
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(PERCENT * normalCdf((raw - mean) / (sd * TAIL_SOFTENING)))))
}

const matchesFactor = (id: CategoryId) => (f: Factor) => CATEGORY[id].match(f)

/** Сирі відсотки (до розтягування) за всіма чинниками: загальний і за сферами. Для калібрування й тестів. */
export function rawScores(all: CrossAspect[], signs: Factor[] = []) {
  const factors = [...all.map(fromAspect), ...signs]
  return {
    overall: rawPercent(factors, SMOOTHING_ALL),
    categories: CATEGORY_IDS.map((id) => ({ id, raw: rawPercent(factors.filter(matchesFactor(id)), SMOOTHING_AREA) })),
  }
}

/** Загальна сумісність 1–100 за всіма аспектами й гармонією знаків; сфери — за чинниками з відповідними планетами. */
export function scoresOf(all: CrossAspect[], signs: Factor[] = []) {
  const raw = rawScores(all, signs)
  const harmonious = all.filter((x) => harmonyShare(x) >= HARMONIOUS_FROM).length
  return {
    overall: stretch(raw.overall, 'overall'),
    categories: raw.categories.map((c) => ({ id: c.id, score: stretch(c.raw, c.id) })),
    counted: { total: all.length, harmonious, tense: all.length - harmonious },
  }
}

const LEVELS: { from: number; label: T2 }[] = [
  { from: 80, label: ['very harmonious', 'дуже гармонійна'] },
  { from: 62, label: ['harmonious', 'гармонійна'] },
  { from: 35, label: ['balanced, with lessons to learn', 'збалансована, з уроками на шляху'] },
  { from: 0, label: ['challenging, but rich in growth', 'непроста, але багата на зростання'] },
]
export const levelOf = (score: number): T2 => (LEVELS.find((l) => score >= l.from) as (typeof LEVELS)[number]).label

// ---------- тлумачення ----------
/** Тема планети між двома людьми: іменникова група, що ставиться в початок речення. */
const THEME: Record<string, T2> = {
  Sun: ['sense of self and shared purpose', 'відчуття себе й спільна мета'],
  Moon: ['feelings and the need for safety', 'почуття й потреба в безпеці'],
  Mercury: ['conversation and understanding', 'розмови й порозуміння'],
  Venus: ['affection and shared values', 'ніжність і спільні цінності'],
  Mars: ['desire, drive and the way you argue', 'бажання, енергія та манера сперечатися'],
  Jupiter: ['trust, growth and generosity', 'довіра, зростання й щедрість'],
  Saturn: ['commitment, duty and boundaries', 'зобов’язання, обов’язок і межі'],
  Uranus: ['freedom and surprise', 'свобода й несподіванки'],
  Neptune: ['dreams and idealisation', 'мрії та ідеалізація'],
  Pluto: ['intensity and transformation', 'інтенсивність і трансформація'],
}

interface PairText {
  ease: T2
  hard: T2
}

/** Особисті тлумачення головних пар; ключ — «Планета-Планета» в будь-якому порядку. Для решти пар — загальний шаблон. */
const PAIR: Record<string, PairText> = {
  'Sun-Sun': {
    ease: ['Your core identities respect each other: you understand what drives the other and rarely compete for the spotlight.', 'Ваші основні «я» поважають одне одного: ви розумієте, що рухає іншим, і рідко змагаєтеся за увагу.'],
    hard: ['Two strong wills meet: you see the world differently, which can feel like competition but also keeps you from getting bored.', 'Дві сильні волі зустрічаються: ви по-різному дивитеся на світ, що може нагадувати змагання, але й не дає нудьгувати.'],
  },
  'Sun-Moon': {
    ease: ['A classic sign of lasting harmony: one of you shines in a way the other feels safe with, and the other gives the warmth that supports the first.', 'Класична ознака тривалої гармонії: один із вас сяє так, що іншому з цим затишно, а той дає тепло, яке підтримує першого.'],
    hard: ['What one wants and what the other needs do not always match; with patience this becomes a push to understand each other more deeply.', 'Те, чого хоче один, і те, що потрібно іншому, не завжди збігається; з терпінням це стає поштовхом глибше розуміти одне одного.'],
  },
  'Moon-Moon': {
    ease: ['You feel in the same rhythm: comfort, mood and the need for closeness are understood without many words.', 'Ви відчуваєте в одному ритмі: затишок, настрій і потреба в близькості зрозумілі без зайвих слів.'],
    hard: ['Your emotional needs differ: one needs closeness when the other needs space, and naming this out loud prevents misreadings.', 'Ваші емоційні потреби різні: комусь потрібна близькість, коли іншому — простір; сказати про це вголос — значить уникнути непорозумінь.'],
  },
  'Sun-Venus': {
    ease: ['Warm admiration: one of you feels genuinely appreciated by the other, and affection comes without effort.', 'Тепле захоплення: один із вас відчуває щире схвалення від іншого, а ніжність приходить без зусиль.'],
    hard: ['Affection is there, but tastes and values do not always match: show appreciation directly so it is not missed.', 'Симпатія є, та смаки й цінності не завжди збігаються: виявляйте вдячність прямо, щоб її не пропустили.'],
  },
  'Sun-Mars': {
    ease: ['Energising together: one of you inspires action in the other, and as a team you get a lot done.', 'Разом ви заряджаєте: один надихає іншого на дію, а як команда ви багато встигаєте.'],
    hard: ['Sparks fly: drive meets will, which can turn into arguments about who leads, so agree on who decides what.', 'Між вами проскакують іскри: енергія зустрічає волю, і це може вилитися в суперечки про те, хто веде, тож домовтеся, хто що вирішує.'],
  },
  'Moon-Venus': {
    ease: ['Gentle, comforting affection: you soothe each other, and being together feels like home.', 'Ніжна, заспокійлива прихильність: ви втішаєте одне одного, а поруч почуваєтеся як удома.'],
    hard: ['Care is sincere but shown in different ways: one wants softness while the other offers pleasure or distance; learn each other’s language of love.', 'Турбота щира, але виявляється по-різному: комусь потрібна м’якість, коли інший пропонує задоволення чи дистанцію; вивчіть «мову кохання» одне одного.'],
  },
  'Moon-Mars': {
    ease: ['Feeling and passion respond to each other: you protect one another and are physically comfortable together.', 'Почуття й пристрасть відгукуються одне одному: ви захищаєте одне одного, а фізично вам разом комфортно.'],
    hard: ['Emotions and drive provoke each other: irritation can flare fast, so cool off before you talk and you keep the passion without the arguments.', 'Емоції й енергія провокують одне одного: роздратування спалахує швидко, тож охолоньте перед розмовою — і пристрасть лишиться без сварок.'],
  },
  'Venus-Venus': {
    ease: ['You love and enjoy things in a similar way: shared taste, shared pleasures and easy affection.', 'Ви однаково любите й насолоджуєтеся: спільні смаки, спільні радощі й легка ніжність.'],
    hard: ['Different ideas of love and value: you may want different things from closeness, so talk openly about what matters.', 'Різне уявлення про кохання й цінності: від близькості ви можете хотіти різного, тож відверто говоріть про важливе.'],
  },
  'Venus-Mars': {
    ease: ['Strong natural attraction and healthy chemistry: desire and tenderness meet in balance.', 'Сильний природний потяг і здорова хімія: бажання й ніжність зустрічаються в рівновазі.'],
    hard: ['Intense chemistry with friction: attraction is strong, though needs and approach may clash, which keeps the bond lively if handled kindly.', 'Інтенсивна хімія з тертям: потяг сильний, хоч потреби й підхід можуть стикатися; це робить стосунки жвавими, якщо діяти м’яко.'],
  },
  'Mars-Mars': {
    ease: ['You move at a similar pace and push in the same direction: working, travelling or building together goes well.', 'Ви рухаєтеся в схожому темпі й тиснете в один бік: працювати, подорожувати чи будувати щось разом добре виходить.'],
    hard: ['Clashing drives: you can irritate each other quickly or compete, so choose shared goals and keep arguments short and fair.', 'Енергії стикаються: ви можете швидко дратувати одне одного чи змагатися, тож обирайте спільні цілі й сперечайтеся коротко та чесно.'],
  },
  'Mercury-Mercury': {
    ease: ['Easy conversation: you pick up each other’s ideas, get the jokes and rarely run out of things to talk about.', 'Легка розмова: ви підхоплюєте ідеї одне одного, розумієте жарти й рідко не маєте про що говорити.'],
    hard: ['You think and speak differently: misunderstandings happen, but asking “how should I read that?” turns them into learning.', 'Ви по-різному думаєте й говорите: непорозуміння трапляються, але питання «як мені це розуміти?» перетворює їх на навчання.'],
  },
  'Mercury-Venus': {
    ease: ['Kind words and pleasant talks: you say what the other likes to hear, and mean it.', 'Добрі слова й приємні розмови: ви кажете те, що іншому приємно чути, і говорите щиро.'],
    hard: ['Words and feelings sometimes miss each other: a compliment can land as criticism, so be explicit and warm.', 'Слова й почуття іноді не збігаються: комплімент може прозвучати як критика, тож говоріть прямо й тепло.'],
  },
  'Sun-Saturn': {
    ease: ['A stabilising link: one of you gives structure and dependable support that the other genuinely values.', 'Стабілізуючий зв’язок: один дає структуру й надійну підтримку, яку інший щиро цінує.'],
    hard: ['One of you can feel judged or held back by the other: honest boundaries and patience turn this into a durable, serious bond.', 'Хтось із вас може почуватися оціненим чи стриманим іншим: чесні межі й терпіння перетворюють це на міцний, серйозний зв’язок.'],
  },
  'Moon-Saturn': {
    ease: ['Emotional reliability: calm, loyal support that makes the relationship feel safe and long-lasting.', 'Емоційна надійність: спокійна, вірна підтримка, що робить стосунки безпечними й довготривалими.'],
    hard: ['Emotional caution: one of you may feel less warmth than needed; reassurance and a steady presence heal this.', 'Емоційна стриманість: комусь може бракувати тепла; запевнення й постійна присутність це лікують.'],
  },
  'Venus-Saturn': {
    ease: ['Loyalty and commitment: love is shown through reliability, and the bond deepens with time.', 'Вірність і зобов’язання: любов виявляється через надійність, а зв’язок із часом поглиблюється.'],
    hard: ['Love feels serious or restricted at times: fear of loss or coldness can appear, yet trust built slowly becomes very durable.', 'Кохання іноді здається надто серйозним чи стриманим: може з’являтися страх втрати чи холодність, та довіра, збудована поволі, стає дуже міцною.'],
  },
}

const GENERIC = {
  en: {
    ease: (a: string, b: string) => `“${cap(a)}” meets “${b}” and the two work together easily: a natural support in the relationship.`,
    conjunction: (a: string, b: string) => `“${cap(a)}” and “${b}” are fused between you: strongly felt and impossible to ignore, for better or for harder.`,
    hard: (a: string, b: string) => `“${cap(a)}” meets “${b}” and the two pull in different directions: friction shows up here first, and it is also where you can learn the most if you talk openly.`,
  },
  uk: {
    ease: (a: string, b: string) => `«${cap(a)}» зустрічається з «${b}», і вони легко працюють разом: природна опора в стосунках.`,
    conjunction: (a: string, b: string) => `«${cap(a)}» і «${b}» зливаються між вами: це сильно відчувається й не лишається непоміченим — на краще чи на складніше.`,
    hard: (a: string, b: string) => `«${cap(a)}» зустрічається з «${b}», і вони тягнуть у різні боки: тертя з’являється тут першим, але тут же можна найбільше навчитися, якщо говорити відверто.`,
  },
}

const isEasy = (type: string) => type !== 'square' && type !== 'opposition'
const pairOf = (a: string, b: string) => PAIR[`${a}-${b}`] ?? PAIR[`${b}-${a}`]

/** Тлумачення одного аспекту між двома людьми: особисте для головних пар, інакше з тем двох планет. */
export function crossMeaning(x: CrossAspect, locale: Locale): string {
  const curated = pairOf(x.a, x.b)
  if (curated) return at(isEasy(x.type) ? curated.ease : curated.hard, locale)
  const [ta, tb] = [at(THEME[x.a], locale), at(THEME[x.b], locale)]
  const g = GENERIC[locale]
  if (x.type === 'conjunction') return g.conjunction(ta, tb)
  return (isEasy(x.type) ? g.ease : g.hard)(ta, tb)
}

// ---------- звіт ----------
interface Words {
  title: (a: string, b: string) => string
  sections: { overview: string; scores: string; connections: string; strengths: string; growth: string; elements: string; note: string }
  head: (n: string, sun: string, moon: string) => string
  overall: (score: number, level: string) => string
  counted: (total: number, harmonious: number, tense: number) => string
  lead: string
  score: (area: string, score: number, text: string) => string
  connection: (who: string, a: string, whom: string, b: string, noun: string, orb: string, text: string) => string
  brief: (who: string, a: string, whom: string, b: string, noun: string) => string
  noEase: string
  noHard: string
  noAspects: string
  relation: Record<'sameSign' | 'sameElement' | 'friendly' | 'tense', (pl: string) => string>
  suns: string
  moons: string
  venuses: string
  marses: string
  note: string
}

const WORDS: Record<Locale, Words> = {
  en: {
    title: (a, b) => `Compatibility: ${a} & ${b}`,
    sections: { overview: 'Overview', scores: 'Compatibility by life sphere', connections: 'Key connections', strengths: 'Strengths', growth: 'Growth areas', elements: 'Elements', note: 'Note' },
    head: (n, sun, moon) => `${n}: Sun in ${sun}, Moon in ${moon}.`,
    overall: (s, l) => `Overall compatibility: ${s}%, ${l}.`,
    counted: (n, h, t) => `This percentage comes from all ${n} aspects between your two charts (${h} harmonious, ${t} tense) and the sign harmony of your key planets, each weighted by how important the planets are and how exact the aspect is. 50% is a typical pair; 80% and more is a rare, very harmonious one.`,
    lead: 'The score is a reflective indicator built from the angles between your two sets of planets, not a verdict: every pairing can work with awareness.',
    score: (area, s, text) => `- ${area}: ${s}%. ${text}`,
    connection: (who, a, whom, b, n, o, t) => `- ${a} (${who}) – ${b} (${whom}): ${n} (orb ${o}°). ${t}`,
    brief: (who, a, whom, b, n) => `- ${a} (${who}) – ${b} (${whom}): ${n}`,
    noEase: 'No strongly easy aspects between your charts: harmony here is built by choice rather than given by the sky.',
    noHard: 'No tense aspects between your charts: friction is mild, so the main work is keeping the bond alive.',
    noAspects: 'No tight aspects between your planets: your charts barely touch, so the relationship takes its shape from what you build together.',
    relation: {
      sameSign: (pl) => `Your ${pl} are in the same sign: you feel and express this part of life in a very similar way.`,
      sameElement: (pl) => `Your ${pl} share an element, so you instinctively speak the same language here.`,
      friendly: (pl) => `Your ${pl} sit in friendly elements: they support each other with little friction.`,
      tense: (pl) => `Your ${pl} sit in elements that do not mix easily: you do this differently, and curiosity works better than judgement.`,
    },
    suns: 'Suns',
    moons: 'Moons',
    venuses: 'Venus signs',
    marses: 'Mars signs',
    note: 'This report is a reflective tool based on the planets’ positions at birth, not a prediction about your relationship. The partner’s Moon is calculated for midday, so its sign is only reliable when the Moon is not close to a sign boundary.',
  },
  uk: {
    title: (a, b) => `Сумісність: ${a} і ${b}`,
    sections: { overview: 'Огляд', scores: 'Сумісність за сферами життя', connections: 'Ключові зв’язки', strengths: 'Сильні сторони', growth: 'Зони зростання', elements: 'Стихії', note: 'Примітка' },
    head: (n, sun, moon) => `${n}: Сонце — ${sun}, Місяць — ${moon}.`,
    overall: (s, l) => `Загальна сумісність: ${s}%, ${l}.`,
    counted: (n, h, t) => `Цей відсоток випливає з усіх ${n} аспектів між вашими двома картами (${h} злагоджених, ${t} напружених) і гармонії знаків ключових планет, кожен чинник — із вагою за важливістю планет і точністю аспекту. 50% — типова пара, 80% і більше — рідкісна, дуже гармонійна.`,
    lead: 'Оцінка — інструмент для роздумів, що спирається на кути між двома наборами планет, а не вирок: кожна пара може працювати за умови усвідомленості.',
    score: (area, s, text) => `- ${area}: ${s}%. ${text}`,
    connection: (who, a, whom, b, n, o, t) => `- ${a} (${who}) – ${b} (${whom}): ${n} (орбіс ${o}°). ${t}`,
    brief: (who, a, whom, b, n) => `- ${a} (${who}) – ${b} (${whom}): ${n}`,
    noEase: 'Яскраво злагоджених аспектів між картами немає: гармонія тут будується свідомим вибором, а не дається небом.',
    noHard: 'Напружених аспектів між картами немає: тертя м’яке, тож головна робота — берегти зв’язок живим.',
    noAspects: 'Щільних аспектів між планетами немає: ваші карти майже не торкаються, тож стосунки набувають форми з того, що ви будуєте разом.',
    relation: {
      sameSign: (pl) => `Ваші ${pl} в одному знаку: цю частину життя ви відчуваєте й виявляєте дуже схоже.`,
      sameElement: (pl) => `Ваші ${pl} в одній стихії, тож тут ви інтуїтивно говорите однією мовою.`,
      friendly: (pl) => `Ваші ${pl} у дружніх стихіях: вони підтримують одне одного майже без тертя.`,
      tense: (pl) => `Ваші ${pl} у стихіях, що поєднуються непросто: ви робите це по-різному, і цікавість допомагає більше, ніж осуд.`,
    },
    suns: 'Сонця',
    moons: 'Місяці',
    venuses: 'Венери',
    marses: 'Марси',
    note: 'Цей звіт — інструмент для роздумів на основі положень планет у момент народження, а не передбачення щодо ваших стосунків. Місяць партнера розраховано на полудень, тож його знак надійний, лише коли Місяць не поблизу межі знаків.',
  },
}

const ASPECT_NOUN: Record<string, T2> = Object.fromEntries(ASPECT.map((d) => [d.type, d.name]))
const block = (title: string, lines: string[]) => `## ${title}\n${lines.join('\n')}`

export interface Compatibility {
  title: string
  text: string
  score: number
  level: string
  categories: { id: CategoryId; name: string; score: number; text: string }[]
  counted: { total: number; harmonious: number; tense: number }
  aspects: (CrossAspect & { meaning: string })[]
  /** Усі аспекти між картами з часткою гармонії (0–1) — для колеса й таблиці. */
  allAspects: (CrossAspect & { harmony: number })[]
}

/** Звіт про сумісність двох карт: огляд із загальною оцінкою, оцінки за сферами, ключові аспекти, сильні сторони та зони зростання. */
export function buildCompatibility(mine: NatalChart, theirs: NatalChart, names: { a: string; b: string }, locale: Locale): Compatibility {
  const W = WORDS[locale]
  const planet = (c: NatalChart, n: string) => c.planets.find((p) => p.name === n) as NatalChart['planets'][number]
  const [sunA, moonA, sunB, moonB] = [planet(mine, 'Sun'), planet(mine, 'Moon'), planet(theirs, 'Sun'), planet(theirs, 'Moon')]
  const all = crossAspects(mine.planets, theirs.planets)
  const { categories, overall, counted } = scoresOf(all, signFactors(mine.planets, theirs.planets))
  const level = at(levelOf(overall), locale)

  const line = (x: CrossAspect) =>
    W.connection(names.a, planetName(x.a, locale), names.b, planetName(x.b, locale), at(ASPECT_NOUN[x.type], locale), x.orb.toFixed(1), crossMeaning(x, locale))
  const brief = (x: CrossAspect) => W.brief(names.a, planetName(x.a, locale), names.b, planetName(x.b, locale), at(ASPECT_NOUN[x.type], locale))
  const strongest = (easy: boolean) => all.filter((x) => isEasy(x.type) === easy).slice(0, TOP_PER_SIDE)
  const easy = strongest(true)
  const hard = strongest(false)
  const shown = all.slice(0, REPORT_ASPECT_LIMIT)

  const overview = [
    W.head(names.a, signName(sunA.sign, locale), signName(moonA.sign, locale)),
    W.head(names.b, signName(sunB.sign, locale), signName(moonB.sign, locale)),
    W.overall(overall, level),
    W.counted(counted.total, counted.harmonious, counted.tense),
    W.lead,
  ]
  const [venusA, marsA, venusB, marsB] = [planet(mine, 'Venus'), planet(mine, 'Mars'), planet(theirs, 'Venus'), planet(theirs, 'Mars')]
  const elements = [
    W.relation[sunMoonRelation(sunA.sign, sunB.sign)](W.suns),
    W.relation[sunMoonRelation(moonA.sign, moonB.sign)](W.moons),
    W.relation[sunMoonRelation(venusA.sign, venusB.sign)](W.venuses),
    W.relation[sunMoonRelation(marsA.sign, marsB.sign)](W.marses),
  ]

  const S = W.sections
  return {
    title: W.title(names.a, names.b),
    text: [
      block(S.overview, overview),
      block(S.scores, categories.map((c) => W.score(at(CATEGORY[c.id].name, locale), c.score, sphereText(c.id, c.score, locale)))),
      block(S.connections, shown.length ? shown.map(line) : [W.noAspects]),
      block(S.strengths, easy.length ? easy.map(brief) : [W.noEase]),
      block(S.growth, hard.length ? hard.map(brief) : [W.noHard]),
      block(S.elements, elements),
      block(S.note, [W.note]),
    ].join('\n\n'),
    score: overall,
    level,
    counted,
    categories: categories.map((c) => ({ ...c, name: at(CATEGORY[c.id].name, locale), text: sphereText(c.id, c.score, locale) })),
    aspects: all.slice(0, CHART_ASPECT_LIMIT).map((x) => ({ ...x, meaning: crossMeaning(x, locale) })),
    allAspects: all.map((x) => ({ ...x, harmony: harmonyShare(x) })),
  }
}
