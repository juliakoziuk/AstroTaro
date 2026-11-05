// Правилова (словникова) трактовка снів: шукає символи за ключовими словами. Це не AI, а довідник значень.
// Слова шукаються будь-якою з трьох мов (людина може писати сон не мовою інтерфейсу), а результат віддається
// мовою користувача. Стеми з \p{L}* ловлять відмінки й форми слів.
import { Locale, LOCALES } from '../i18n/locale'

type T3 = [string, string, string]
const at = (t: T3, l: Locale) => t[LOCALES.indexOf(l)]

interface Symbol {
  words: string // фрагмент регулярного виразу для всіх мов
  tag: T3
  meaning: T3 // частина фрази «Цей сон може означати, що …»
  key: T3
}

const SYMBOLS: Symbol[] = [
  { words: 'houses?|homes?|rooms?|будинк\\p{L}*|дім|дом\\p{L}*|кімнат\\p{L}*|хат\\p{L}*|casas?|hogar|habitaci\\p{L}+', tag: ['House', 'Будинок', 'Casa'], meaning: ['the house stands for the self and its inner rooms', 'будинок уособлює твоє «я» та його внутрішні кімнати', 'la casa representa el yo y sus habitaciones interiores'], key: ['Inner self', 'Внутрішнє «я»', 'Yo interior'] },
  { words: 'child\\p{L}*|kids?|school|дитинств\\p{L}*|дитин\\p{L}*|діти|дітьми|школ\\p{L}*|niñ\\p{L}+|infancia|escuela|colegio', tag: ['Childhood', 'Дитинство', 'Infancia'], meaning: ['a return to your roots and early memories', 'це повернення до коріння та ранніх спогадів', 'un regreso a tus raíces y a los primeros recuerdos'], key: ['Roots', 'Коріння', 'Raíces'] },
  { words: 'light|sun|sunrise|glow\\p{L}*|bright|світл\\p{L}*|сонц\\p{L}*|сяйв\\p{L}*|яскрав\\p{L}*|світанк\\p{L}*|luz|sol|amanecer|brillante|resplandor', tag: ['Light', 'Світло', 'Luz'], meaning: ['light marks insight and discovery', 'світло означає прозріння та відкриття', 'la luz marca la comprensión y el descubrimiento'], key: ['Insight', 'Прозріння', 'Comprensión'] },
  { words: 'search\\p{L}*|looking for|looked for|find|found|lost|шука\\p{L}*|пошук\\p{L}*|знайш\\p{L}*|знайд\\p{L}*|загуб\\p{L}*|втрат\\p{L}*|busc\\p{L}+|encontr\\p{L}+|perdid\\p{L}*|perdí', tag: ['Search', 'Пошук', 'Búsqueda'], meaning: ['searching points to a need you have not yet named', 'пошук вказує на потребу, яку ще не названо', 'buscar apunta a una necesidad que aún no has nombrado'], key: ['Search', 'Пошук', 'Búsqueda'] },
  { words: 'forest|woods|trees?|ліс\\p{L}*|дерев\\p{L}*|гай|bosque|selva|árbol\\p{L}*|arboles', tag: ['Forest', 'Ліс', 'Bosque'], meaning: ['the forest is the unknown parts of yourself', 'ліс — це ще незвідані частини тебе', 'el bosque son las partes desconocidas de ti'], key: ['The unknown', 'Невідоме', 'Lo desconocido'] },
  { words: 'water|ocean|sea|rivers?|lakes?|rain|waves?|вод[аиуіоюе]|вод\\p{L}{2,}|океан\\p{L}*|море|моря|морі|морю|морем|річк\\p{L}*|озер\\p{L}*|дощ\\p{L}*|хвил\\p{L}*|agua|oc[eé]ano|mar|r[ií]o|lago|lluvia|olas?', tag: ['Water', 'Вода', 'Agua'], meaning: ['water reflects emotion and the subconscious', 'вода відображає емоції та підсвідомість', 'el agua refleja la emoción y el subconsciente'], key: ['Emotions', 'Емоції', 'Emociones'] },
  { words: 'fly|flying|flew|flight|sky|clouds?|літа\\p{L}*|лет\\p{L}*|політ\\p{L}*|небо|неба|небі|хмар\\p{L}*|volar|volaba|vuelo|volé|cielo|nubes?', tag: ['Flying', 'Політ', 'Vuelo'], meaning: ['flying symbolizes freedom and transcending limits', 'політ символізує свободу й вихід за власні межі', 'volar simboliza la libertad y superar los límites'], key: ['Freedom', 'Свобода', 'Libertad'] },
  { words: 'stairs|staircase|climb\\p{L}*|steps|сходи|сходах|сходів|сходин\\p{L}*|драбин\\p{L}*|підійм\\p{L}*|піднім\\p{L}*|escaleras?|escalar|subía|subir', tag: ['Stairs', 'Сходи', 'Escaleras'], meaning: ['stairs show a path of growth, step by step', 'сходи показують шлях зростання, крок за кроком', 'las escaleras muestran un camino de crecimiento, paso a paso'], key: ['Growth', 'Зростання', 'Crecimiento'] },
  { words: 'doors?|gates?|key|двер\\p{L}*|брам\\p{L}*|ворота|ключ\\p{L}*|puertas?|llave|portal', tag: ['Door', 'Двері', 'Puerta'], meaning: ['a door means a new opportunity or a choice', 'двері означають нову можливість або вибір', 'una puerta significa una nueva oportunidad o una elección'], key: ['New opportunities', 'Нові можливості', 'Nuevas oportunidades'] },
  { words: 'city|town|streets?|місто|міста|місті|містом|вулиц\\p{L}*|ciudad|pueblo|calles?', tag: ['City', 'Місто', 'Ciudad'], meaning: ['a city reflects your social world and ambitions', 'місто відображає твій соціальний світ і амбіції', 'la ciudad refleja tu mundo social y tus ambiciones'], key: ['Ambition', 'Амбіції', 'Ambición'] },
  { words: 'whale|dog|cat|bird|horse|wolf|snake|animal|кит\\p{L}*|собак\\p{L}*|кіт|кішк\\p{L}*|птах\\p{L}*|птиц\\p{L}*|коні|коня|кінь|вовк\\p{L}*|змі[яюї]\\p{L}*|тварин\\p{L}*|ballena|perro|gato|pájaro|ave|caballo|lobo|serpiente|animal\\p{L}*', tag: ['Animal', 'Тварина', 'Animal'], meaning: ['animals carry instinct and unspoken feelings', 'тварини несуть інстинкт і невисловлені почуття', 'los animales traen instinto y sentimientos no dichos'], key: ['Instinct', 'Інстинкт', 'Instinto'] },
  { words: 'stranger|unknown person|someone i didn|person i didn|незнайом\\p{L}*|чужин\\p{L}*|невідом\\p{L}+ (?:людин|чолов|жінк)\\p{L}*|desconocid\\p{L}+|extraño|extraña|forastero', tag: ['Stranger', 'Незнайомець', 'Desconocido'], meaning: ['a stranger is an unrecognized part of you', 'незнайомець — це нерозпізнана частина тебе', 'un desconocido es una parte de ti que no reconoces'], key: ['Hidden self', 'Приховане «я»', 'Yo oculto'] },
  { words: 'fall|falling|fell|пада\\p{L}*|впав\\p{L}*|упав\\p{L}*|падінн\\p{L}*|caer|cayendo|caí|caída', tag: ['Falling', 'Падіння', 'Caída'], meaning: ['falling speaks of losing control or letting go', 'падіння говорить про втрату контролю або вміння відпускати', 'caer habla de perder el control o de soltar'], key: ['Letting go', 'Відпускання', 'Soltar'] },
]

// межа слова для будь-яких літер (\b не працює з кирилицею)
const matcher = (fragment: string) => new RegExp(`(?<!\\p{L})(?:${fragment})(?!\\p{L})`, 'iu')
const COMPILED = SYMBOLS.map((s) => ({ ...s, re: matcher(s.words) }))

/** Усі назви тегів усіма мовами: щоб відрізнити автоматичні теги від тих, що людина задала сама. */
export const ALL_TAGS = new Set(SYMBOLS.flatMap((s) => s.tag))

export type DreamKind = 'Dream' | 'Lucid Dream' | 'Nightmare'
export const KIND_LABEL: Record<DreamKind, T3> = {
  Dream: ['Dream', 'Сон', 'Sueño'],
  'Lucid Dream': ['Lucid Dream', 'Усвідомлений сон', 'Sueño lúcido'],
  Nightmare: ['Nightmare', 'Кошмар', 'Pesadilla'],
}

const LUCID = matcher('lucid|realised i was dreaming|realized i was dreaming|knew i was dreaming|усвідомлен\\p{L}*|(?:я )?(?:розумів|розуміла|знав|знала),? що сплю|l[úu]cido|sab[íi]a que so[ñn]aba|me di cuenta de que so[ñn]aba')
const NIGHTMARE = new RegExp('(?<!\\p{L})(?:terrif|nightmare|monster|afraid|scared|chased|screamed|кошмар|жах|страшн|злякал|переслід|монстр|кричал|боял|pesadilla|terror|miedo|asustad|monstruo|perseguid|grit)', 'iu')

const LEAD: Text3 = ['This dream may suggest that {m}.', 'Цей сон може означати, що {m}.', 'Este sueño puede sugerir que {m}.']
type Text3 = T3
const GENERIC: T3 = [
  'This dream does not lean on a familiar symbol, so look to the feeling it left in you: that feeling is the message.',
  'У цьому сні немає знайомого символу, тож зверни увагу на відчуття, яке він залишив: саме воно й є повідомленням.',
  'Este sueño no se apoya en un símbolo conocido; fíjate en la sensación que te dejó: esa sensación es el mensaje.',
]

export interface DreamAnalysis {
  symbols: string[]
  keyMeanings: string[]
  interpretation: string
  kind: string
}

export function analyzeDream(title: string, text: string, locale: Locale): DreamAnalysis {
  const hay = `${title} ${text}`
  const found = COMPILED.filter((s) => s.re.test(hay))
  const kind: DreamKind = LUCID.test(hay) ? 'Lucid Dream' : NIGHTMARE.test(hay) ? 'Nightmare' : 'Dream'
  const top = found.slice(0, 3)
  return {
    symbols: found.map((f) => at(f.tag, locale)),
    keyMeanings: top.map((f) => at(f.key, locale)),
    interpretation: top.length ? at(LEAD, locale).replace('{m}', top.map((f) => at(f.meaning, locale)).join('; ')) : at(GENERIC, locale),
    kind: at(KIND_LABEL[kind], locale),
  }
}
