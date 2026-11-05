// Аналіз витягнутих карт без тексту: з чого складається розклад (мажори, масті, перевороти, числа, пари) і як змінюється
// настрій від позиції до позиції. Текст із цих фактів збирає narrative.ts; ці ж факти можна віддати моделі.
import { DrawnCard } from './readings'
import { Sphere, Situation } from './sphere'

// масті: 0 Жезли (вогонь), 1 Кубки (вода), 2 Мечі (повітря), 3 Пентаклі (земля)
export interface CardInfo {
  id: number
  reversed: boolean
  major: boolean
  suit: number // -1 для старших арканів
  rank: number // 0 туз … 9 десятка, 10 паж, 11 лицар, 12 королева, 13 король; -1 для старших
  court: boolean
  valence: number // -2 важка … +2 світла, вже з урахуванням переворота
}

// «Світлість» старших арканів у прямому положенні
const MAJOR_VALENCE = [1, 2, 1, 2, 1, 1, 2, 2, 2, 0, 1, 1, 0, -1, 1, -2, -2, 2, -1, 2, 1, 2]
// молодші за рангом, туз … десятка; придворні — окремо
const RANK_VALENCE = [2, 0, 2, 0, -2, 1, -1, 0, 0, 1]
// відомі «важкі» й «світлі» карти за мастями, що відхиляються від рангу
const SUIT_RANK_VALENCE: Record<string, number> = {
  '2-0': 1, '2-1': -1, '2-2': -2, '2-4': -2, '2-5': 0, '2-6': -1, '2-7': -1, '2-8': -2, '2-9': -2,
  '1-2': 2, '1-4': -1, '1-6': 0, '1-7': -1, '1-8': 2, '1-9': 2,
  '0-4': -1, '0-6': 0, '0-8': 0, '0-9': -1,
  '3-3': 0, '3-4': -2, '3-7': 1, '3-8': 2, '3-9': 2,
}

export function infoOf(d: DrawnCard): CardInfo {
  const major = d.id < 22
  const n = d.id - 22
  const suit = major ? -1 : Math.floor(n / 14)
  const rank = major ? -1 : n % 14
  const court = rank >= 10
  const upright = major ? MAJOR_VALENCE[d.id] : court ? 1 : (SUIT_RANK_VALENCE[`${suit}-${rank}`] ?? RANK_VALENCE[rank])
  // у перевернутому положенні світла карта блокується, а важка послаблюється
  const valence = d.reversed ? (upright < 0 ? 1 : -1) : upright
  return { id: d.id, reversed: d.reversed, major, suit, rank, court, valence }
}

// Розклад «Так/Ні»: відповідь дає те, наскільки світла карта (з урахуванням перевороту); нейтральна карта — «ще не час»
export interface Verdict {
  answer: 'yes' | 'no' | 'maybe'
  strength: 'strong' | 'leaning'
}

export function verdictFromValence(valence: number): Verdict {
  if (valence >= 2) return { answer: 'yes', strength: 'strong' }
  if (valence === 1) return { answer: 'yes', strength: 'leaning' }
  if (valence <= -2) return { answer: 'no', strength: 'strong' }
  if (valence === -1) return { answer: 'no', strength: 'leaning' }
  return { answer: 'maybe', strength: 'leaning' }
}

export const verdictOf = (d: DrawnCard): Verdict => verdictFromValence(infoOf(d).valence)

export type Tone = 'bright' | 'hopeful' | 'mixed' | 'heavy'
export type Trajectory = 'rising' | 'falling' | 'dip' | 'peak' | 'steady'

// Пари старших арканів, які читають разом, незалежно від порядку й положення. Ключ — менший id + «-» + більший.
export const NAMED_PAIRS = ['16-17', '6-15', '15-16', '10-11', '0-1', '2-9', '13-20', '12-13', '7-8', '17-18', '19-21', '3-4'] as const

export interface Analysis {
  cards: CardInfo[]
  tone: Tone
  trajectory: Trajectory | null // для послідовних розкладів із трьох карт
  majors: number
  dominantSuit: number | null
  reversedShare: number
  courts: number
  repeatedRanks: number[] // ранги, що повторюються (без придворних)
  namedPairs: { key: (typeof NAMED_PAIRS)[number]; a: number; b: number }[] // a, b — індекси карт у розкладі
  topic: Exclude<Sphere, 'general'> | null // сфера питання; null, якщо питання загальне чи його немає
  topicCard: number | null // індекс карти, що найближча до сфери питання
  seed: number // детермінований вибір варіантів тексту: той самий розклад завжди читається однаково
}

// масті, що говорять про сферу найпрямішою мовою
const TOPIC_SUITS: Record<Exclude<Sphere, 'general'>, number[]> = { love: [1], family: [1, 3], career: [3, 0], money: [3], health: [3], self: [1], decision: [2] }

function toneOf(vals: number[]): Tone {
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length
  const split = vals.some((v) => v >= 1) && vals.some((v) => v <= -1)
  if (avg >= 1.2) return 'bright'
  if (avg <= -0.8) return 'heavy'
  if (split && Math.abs(avg) < 0.8) return 'mixed'
  return avg >= 0.3 ? 'hopeful' : avg <= -0.3 ? 'heavy' : 'mixed'
}

function trajectoryOf(v: number[]): Trajectory {
  const [a, b, c] = v
  if (b < a && b < c) return 'dip'
  if (b > a && b > c) return 'peak'
  if (c > a) return 'rising'
  if (c < a) return 'falling'
  return 'steady'
}

export function analyze(spreadId: string, drawn: DrawnCard[], situation: Situation): Analysis {
  const cards = drawn.map(infoOf)
  const vals = cards.map((c) => c.valence)
  const n = cards.length

  const suitCount = [0, 0, 0, 0]
  for (const c of cards) if (c.suit >= 0) suitCount[c.suit]++
  const top = Math.max(...suitCount)
  // масть «домінує», якщо їй належить щонайменше половина карт (і не менше двох)
  const dominantSuit = n >= 2 && top >= 2 && top >= Math.ceil(n / 2) && suitCount.filter((x) => x === top).length === 1 ? suitCount.indexOf(top) : null

  const rankCount = new Map<number, number>()
  for (const c of cards) if (c.rank >= 0 && !c.court) rankCount.set(c.rank, (rankCount.get(c.rank) ?? 0) + 1)

  const namedPairs: Analysis['namedPairs'] = []
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const lo = Math.min(cards[i].id, cards[j].id)
      const hi = Math.max(cards[i].id, cards[j].id)
      const key = `${lo}-${hi}` as (typeof NAMED_PAIRS)[number]
      if (cards[i].major && cards[j].major && (NAMED_PAIRS as readonly string[]).includes(key)) namedPairs.push({ key, a: i, b: j })
    }

  const topic = situation.sphere === 'general' ? null : situation.sphere
  const topicCard = topic ? cards.findIndex((c) => TOPIC_SUITS[topic].includes(c.suit)) : -1

  return {
    cards,
    tone: toneOf(vals),
    trajectory: n === 3 && (spreadId === 'three' || spreadId === 'purpose') ? trajectoryOf(vals) : null,
    majors: cards.filter((c) => c.major).length,
    dominantSuit,
    reversedShare: cards.filter((c) => c.reversed).length / n,
    courts: cards.filter((c) => c.court).length,
    repeatedRanks: [...rankCount].filter(([, k]) => k >= 2).map(([r]) => r),
    namedPairs,
    topic,
    topicCard: topicCard >= 0 ? topicCard : null,
    seed: drawn.reduce((s, d, i) => (s * 31 + d.id * 2 + (d.reversed ? 1 : 0) + i) % 1_000_003, 7),
  }
}
