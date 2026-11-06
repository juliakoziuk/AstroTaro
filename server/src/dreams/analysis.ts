// Правилова (словникова) трактовка снів: шукає символи за ключовими словами. Це не AI, а довідник значень.
// Слова шукаються будь-якою з трьох мов (людина може писати сон не мовою інтерфейсу), а результат віддається
// мовою користувача. Стеми з \p{L}* ловлять відмінки й форми слів.
import { Locale, LOCALES } from '../i18n/locale'

type T2 = [string, string]
const at = (t: T2, l: Locale) => t[LOCALES.indexOf(l)]

interface Symbol {
  words: string // фрагмент регулярного виразу для всіх мов
  tag: T2
  meaning: T2 // частина фрази «Цей сон може означати, що …»
  key: T2
}

const SYMBOLS: Symbol[] = [
  { words: 'houses?|homes?|rooms?|будинк\\p{L}*|дім|дом\\p{L}*|кімнат\\p{L}*|хат\\p{L}*|casas?|hogar|habitaci\\p{L}+', tag: ['House', 'Будинок'], meaning: ['the house stands for the self and its inner rooms', 'будинок уособлює твоє «я» та його внутрішні кімнати'], key: ['Inner self', 'Внутрішнє «я»'] },
  { words: 'child\\p{L}*|kids?|school|дитинств\\p{L}*|дитин\\p{L}*|діти|дітьми|школ\\p{L}*|niñ\\p{L}+|infancia|escuela|colegio', tag: ['Childhood', 'Дитинство'], meaning: ['a return to your roots and early memories', 'це повернення до коріння та ранніх спогадів'], key: ['Roots', 'Коріння'] },
  { words: 'light|sun|sunrise|glow\\p{L}*|bright|світл\\p{L}*|сонц\\p{L}*|сяйв\\p{L}*|яскрав\\p{L}*|світанк\\p{L}*|luz|sol|amanecer|brillante|resplandor', tag: ['Light', 'Світло'], meaning: ['light marks insight and discovery', 'світло означає прозріння та відкриття'], key: ['Insight', 'Прозріння'] },
  { words: 'search\\p{L}*|looking for|looked for|find|found|lost|шука\\p{L}*|пошук\\p{L}*|знайш\\p{L}*|знайд\\p{L}*|загуб\\p{L}*|втрат\\p{L}*|busc\\p{L}+|encontr\\p{L}+|perdid\\p{L}*|perdí', tag: ['Search', 'Пошук'], meaning: ['searching points to a need you have not yet named', 'пошук вказує на потребу, яку ще не названо'], key: ['Search', 'Пошук'] },
  { words: 'forest|woods|trees?|ліс\\p{L}*|дерев\\p{L}*|гай|bosque|selva|árbol\\p{L}*|arboles', tag: ['Forest', 'Ліс'], meaning: ['the forest is the unknown parts of yourself', 'ліс — це ще незвідані частини тебе'], key: ['The unknown', 'Невідоме'] },
  { words: 'water|ocean|sea|rivers?|lakes?|rain|waves?|вод[аиуіоюе]|вод\\p{L}{2,}|океан\\p{L}*|море|моря|морі|морю|морем|річк\\p{L}*|озер\\p{L}*|дощ\\p{L}*|хвил\\p{L}*|agua|oc[eé]ano|mar|r[ií]o|lago|lluvia|olas?', tag: ['Water', 'Вода'], meaning: ['water reflects emotion and the subconscious', 'вода відображає емоції та підсвідомість'], key: ['Emotions', 'Емоції'] },
  { words: 'fly|flying|flew|flight|sky|clouds?|літа\\p{L}*|лет\\p{L}*|політ\\p{L}*|небо|неба|небі|хмар\\p{L}*|volar|volaba|vuelo|volé|cielo|nubes?', tag: ['Flying', 'Політ'], meaning: ['flying symbolizes freedom and transcending limits', 'політ символізує свободу й вихід за власні межі'], key: ['Freedom', 'Свобода'] },
  { words: 'stairs|staircase|climb\\p{L}*|steps|сходи|сходах|сходів|сходин\\p{L}*|драбин\\p{L}*|підійм\\p{L}*|піднім\\p{L}*|escaleras?|escalar|subía|subir', tag: ['Stairs', 'Сходи'], meaning: ['stairs show a path of growth, step by step', 'сходи показують шлях зростання, крок за кроком'], key: ['Growth', 'Зростання'] },
  { words: 'doors?|gates?|key|двер\\p{L}*|брам\\p{L}*|ворота|ключ\\p{L}*|puertas?|llave|portal', tag: ['Door', 'Двері'], meaning: ['a door means a new opportunity or a choice', 'двері означають нову можливість або вибір'], key: ['New opportunities', 'Нові можливості'] },
  { words: 'city|town|streets?|місто|міста|місті|містом|вулиц\\p{L}*|ciudad|pueblo|calles?', tag: ['City', 'Місто'], meaning: ['a city reflects your social world and ambitions', 'місто відображає твій соціальний світ і амбіції'], key: ['Ambition', 'Амбіції'] },
  { words: 'whale|dog|cat|bird|horse|wolf|snake|animal|кит\\p{L}*|собак\\p{L}*|кіт|кішк\\p{L}*|птах\\p{L}*|птиц\\p{L}*|коні|коня|кінь|вовк\\p{L}*|змі[яюї]\\p{L}*|тварин\\p{L}*|ballena|perro|gato|pájaro|ave|caballo|lobo|serpiente|animal\\p{L}*', tag: ['Animal', 'Тварина'], meaning: ['animals carry instinct and unspoken feelings', 'тварини несуть інстинкт і невисловлені почуття'], key: ['Instinct', 'Інстинкт'] },
  { words: 'stranger|unknown person|someone i didn|person i didn|незнайом\\p{L}*|чужин\\p{L}*|невідом\\p{L}+ (?:людин|чолов|жінк)\\p{L}*|desconocid\\p{L}+|extraño|extraña|forastero', tag: ['Stranger', 'Незнайомець'], meaning: ['a stranger is an unrecognized part of you', 'незнайомець — це нерозпізнана частина тебе'], key: ['Hidden self', 'Приховане «я»'] },
  { words: 'fall|falling|fell|пада\\p{L}*|впав\\p{L}*|упав\\p{L}*|падінн\\p{L}*|caer|cayendo|caí|caída', tag: ['Falling', 'Падіння'], meaning: ['falling speaks of losing control or letting go', 'падіння говорить про втрату контролю або вміння відпускати'], key: ['Letting go', 'Відпускання'] },
]

// межа слова для будь-яких літер (\b не працює з кирилицею)
const matcher = (fragment: string) => new RegExp(`(?<!\\p{L})(?:${fragment})(?!\\p{L})`, 'iu')
const COMPILED = SYMBOLS.map((s) => ({ ...s, re: matcher(s.words) }))

/** Усі назви тегів усіма мовами: щоб відрізнити автоматичні теги від тих, що людина задала сама. */
export const ALL_TAGS = new Set(SYMBOLS.flatMap((s) => s.tag))

export type DreamKind = 'Dream' | 'Lucid Dream' | 'Nightmare'
export const KIND_LABEL: Record<DreamKind, T2> = {
  Dream: ['Dream', 'Сон'],
  'Lucid Dream': ['Lucid Dream', 'Усвідомлений сон'],
  Nightmare: ['Nightmare', 'Кошмар'],
}

const LUCID = matcher('lucid|realised i was dreaming|realized i was dreaming|knew i was dreaming|усвідомлен\\p{L}*|(?:я )?(?:розумів|розуміла|знав|знала),? що сплю|l[úu]cido|sab[íi]a que so[ñn]aba|me di cuenta de que so[ñn]aba')
const NIGHTMARE = new RegExp('(?<!\\p{L})(?:terrif|nightmare|monster|afraid|scared|chased|screamed|кошмар|жах|страшн|злякал|переслід|монстр|кричал|боял|pesadilla|terror|miedo|asustad|monstruo|perseguid|grit)', 'iu')

const LEAD: Text3 = ['This dream may suggest that {m}.', 'Цей сон може означати, що {m}.']
type Text3 = T2
const GENERIC: T2 = [
  'This dream does not lean on a familiar symbol, so look to the feeling it left in you: that feeling is the message.',
  'У цьому сні немає знайомого символу, тож зверни увагу на відчуття, яке він залишив: саме воно й є повідомленням.',
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
