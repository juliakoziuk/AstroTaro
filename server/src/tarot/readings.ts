import { Locale, LOCALES } from '../i18n/locale'
import { analyze, Verdict, verdictFromValence } from './analysis'
import { CARD_COUNT, cardOf } from './cards'
import { giftShadowLine, pairLine, practiceLine, reflectQuestion, reversedNote, roleLine, summaryParts } from './narrative'
import { classifyLocal, Situation } from './sphere'

type T2 = [string, string]
const at = (t: T2, l: Locale) => t[LOCALES.indexOf(l)]

export interface SpreadDef {
  id: string
  name: string
  positions: string[]
}

// id розкладу лишається однаковим у всіх мовах; назва й позиції перекладаються
const SPREAD_TEXT: { id: string; name: T2; positions: T2[] }[] = [
  { id: 'daily', name: ['Daily Card', 'Карта дня'], positions: [['Today', 'Сьогодні']] },
  { id: 'three', name: ['Three Cards', 'Три карти'], positions: [['Past', 'Минуле'], ['Present', 'Теперішнє'], ['Future', 'Майбутнє']] },
  { id: 'relationship', name: ['Relationship', 'Стосунки'], positions: [['You', 'Ти'], ['Partner', 'Партнер'], ['Connection', 'Зв’язок']] },
  { id: 'career', name: ['Career', 'Кар’єра'], positions: [['Situation', 'Ситуація'], ['Obstacle', 'Перешкода'], ['Outcome', 'Результат']] },
  { id: 'purpose', name: ['Life Purpose', 'Призначення'], positions: [['Roots', 'Коріння'], ['Calling', 'Покликання'], ['Path', 'Шлях']] },
  { id: 'yesno', name: ['Yes / No', 'Так / Ні'], positions: [['Answer', 'Відповідь']] },
  { id: 'custom', name: ['Custom Spread', 'Власний розклад'], positions: [['Focus', 'Фокус'], ['Challenge', 'Виклик'], ['Advice', 'Порада']] },
]

export const SPREAD_IDS = SPREAD_TEXT.map((s) => s.id)

export const spreadsFor = (locale: Locale): SpreadDef[] =>
  SPREAD_TEXT.map((s) => ({ id: s.id, name: at(s.name, locale), positions: s.positions.map((p) => at(p, locale)) }))

export const DECKS = ['Classic Tarot', 'Rider-Waite', 'Thoth', 'Marseille']
export const MODES = ['quick', 'detailed', 'depth'] as const
export type Mode = (typeof MODES)[number]

export interface DrawnCard {
  id: number
  reversed: boolean
}

const spreadOf = (id: string) => {
  const s = SPREAD_TEXT.find((x) => x.id === id)
  if (!s) throw new Error(`Unknown spread: ${id}`)
  return s
}

/** Витягує по одній унікальній карті на кожну позицію розкладу (тасування Фішера–Єйтса). */
export function draw(spreadId: string, rng: () => number = Math.random): DrawnCard[] {
  const { positions } = spreadOf(spreadId)
  const ids = Array.from({ length: CARD_COUNT }, (_, i) => i)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return positions.map((_, i) => ({ id: ids[i], reversed: rng() < 0.3 }))
}

/**
 * Карти, які людина витягнула сама (з колоди в застосунку або зі своєї колоди): по одній різній на кожну позицію.
 * Кидає Error('count' | 'duplicate' | 'range'), щоб контролер перетворив це на зрозумілу відповідь.
 */
export function chosen(spreadId: string, cards: DrawnCard[]): DrawnCard[] {
  const { positions } = spreadOf(spreadId)
  if (cards.length !== positions.length) throw new Error('count')
  if (cards.some((c) => !Number.isInteger(c.id) || c.id < 0 || c.id >= CARD_COUNT)) throw new Error('range')
  if (new Set(cards.map((c) => c.id)).size !== cards.length) throw new Error('duplicate')
  return cards.map((c) => ({ id: c.id, reversed: !!c.reversed }))
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const sentence = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}.`

const TRUST: Record<Locale, string> = {
  en: 'Take time to journal on what each card stirs in you, and trust the process: the reading shows a direction, not a fixed fate.',
  uk: 'Знайди час записати, що викликає в тобі кожна карта, і довірся процесу: розклад показує напрям, а не незмінну долю.',
}

export interface Interpretation {
  // meaning — короткий текст у рядку списку; detail — повний текст про карту в її позиції (залежить від режиму)
  positions: { label: string; card: string; reversed: boolean; meaning: string; detail: string }[]
  summary: string
  source?: 'ai' | 'local' // чий текст у summary: моделі чи движка
  verdict?: Verdict // лише для розкладу «Так/Ні»
}

/**
 * Тлумачення з урахуванням контексту: роль карти в позиції, переворот, взаємодія із сусідньою картою, динаміка розкладу,
 * відомі пари, повтори чисел і тема питання. Режими різні за змістом, а не лише за довжиною:
 *   quick    — суть: настрій і рух розкладу, одна порада; у рядках лише суть кожної карти;
 *   detailed — розбір по картах (роль у позиції, зв’язок із сусідньою), будова розкладу й порада;
 *   depth    — ще й відомі пари та повтори, дар і тінь кожної карти, запитання для роздумів і вправа на тиждень.
 */
export function interpret(spreadId: string, drawn: DrawnCard[], mode: Mode, locale: Locale, question = '', situation: Situation = classifyLocal(question)): Interpretation {
  const labels = spreadsFor(locale).find((s) => s.id === spreadId)!.positions
  const analysis = analyze(spreadId, drawn, situation)
  const cards = drawn.map((d) => cardOf(d.id, locale))
  const names = cards.map((c) => c.name)
  const parts = summaryParts(spreadId, analysis, names, locale)
  const meaningOf = (i: number) => lower(drawn[i].reversed ? cards[i].reversed : cards[i].upright)
  const role = (i: number) => roleLine(spreadId, i, meaningOf(i), locale)

  const positions = drawn.map((d, i) => {
    const out = [role(i)]
    if (mode !== 'quick') {
      if (d.reversed) out.push(reversedNote(locale))
      if (i > 0) out.push(pairLine(analysis.cards[i - 1], analysis.cards[i], names[i - 1], names[i], locale))
    }
    if (mode === 'depth') out.push(giftShadowLine(names[i], lower(cards[i].upright), lower(cards[i].reversed), d.reversed, locale))
    if (mode === 'depth') out.push(reflectQuestion(analysis.cards[i].valence >= 1 ? 'bright' : analysis.cards[i].valence <= -1 ? 'heavy' : 'mixed', locale))
    return { label: labels[i], card: names[i], reversed: d.reversed, meaning: mode === 'quick' ? sentence(meaningOf(i)) : role(i), detail: out.join(' ') }
  })

  // у «Так/Ні» відповідь іде першою, без загального настрою
  const summary = spreadId === 'yesno' ? [...parts.spread] : [parts.tone, ...parts.spread]
  if (mode !== 'quick') summary.push(...drawn.map((_, i) => role(i)), ...parts.structure)
  if (mode === 'depth') {
    summary.push(...parts.combos)
    summary.push(...drawn.map((d, i) => giftShadowLine(names[i], lower(cards[i].upright), lower(cards[i].reversed), d.reversed, locale)))
    summary.push(reflectQuestion(analysis.tone, locale), practiceLine(analysis.seed, locale))
  }
  summary.push(parts.closing)
  if (mode === 'depth') summary.push(TRUST[locale])
  return { positions, summary: summary.join(' '), ...(spreadId === 'yesno' ? { verdict: verdictFromValence(analysis.cards[0].valence) } : {}) }
}
