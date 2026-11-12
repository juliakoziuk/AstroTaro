import { Locale, LOCALES } from '../i18n/locale'
import { analyze, Verdict, verdictFromValence } from './analysis'
import { CARD_COUNT, cardOf } from './cards'
import { headline, insightLines, keyIndex, keyLine, lower, outlookLine, pairLine, practiceLine, questionEcho, questionLines, reversedNote, roleLine, otherSideLine, sceneLine, sentence, suitSphereLine, summaryParts, tipLine, trustLine, watchLine, closingLine } from './narrative'
import { plainOf } from './plain'
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

export interface Interpretation {
  // meaning — короткий текст у рядку списку; detail — повний текст про карту в її позиції (залежить від режиму)
  positions: { label: string; card: string; reversed: boolean; meaning: string; detail: string }[]
  summary: string
  source?: 'ai' | 'local' // чий текст у summary: моделі чи движка
  verdict?: Verdict // лише для розкладу «Так/Ні»
}

/**
 * Тлумачення людською мовою з урахуванням контексту: роль карти в позиції, переворот, сусідня карта, відомі пари, повтори
 * чисел і сфера питання. Режими різні за змістом, а не лише за довжиною:
 *   quick    — відповідь у двох-трьох реченнях: загальний висновок, головна карта розкладу й одна порада;
 *   detailed — розповідь по позиціях: що означає кожна карта на своєму місці, як вона пов’язана із сусідньою, будова розкладу й порада;
 *   depth    — розбір «що тут може бути насправді»: приклади з життя для кожної карти, що означає масть у твоїй сфері, пари й повтори,
 *              що робити далі, на що звернути увагу, запитання, прив’язані до карт, і вправа на тиждень.
 * Абзаци тексту розділені порожнім рядком.
 */
export function interpret(spreadId: string, drawn: DrawnCard[], mode: Mode, locale: Locale, question = '', situation: Situation = classifyLocal(question)): Interpretation {
  const labels = spreadsFor(locale).find((s) => s.id === spreadId)!.positions
  const a = analyze(spreadId, drawn, situation)
  const names = drawn.map((d) => cardOf(d.id, locale).name)
  const plain = drawn.map((d) => plainOf(d.id, locale))
  const what = (i: number) => (drawn[i].reversed ? plain[i].rev : plain[i].up)
  const role = (i: number) => roleLine(spreadId, i, what(i), locale)
  const tips = plain.map((p) => p.tip)
  const scenes = plain.map((p) => p.scene)
  const pair = (i: number) => pairLine(a.cards[i - 1], a.cards[i], names[i - 1], names[i], locale)
  const key = keyIndex(spreadId, a)
  const single = drawn.length === 1
  const parts = summaryParts(spreadId, a, names, locale)
  const head = headline(spreadId, a, locale)

  const positions = drawn.map((d, i) => {
    const out = [role(i)]
    if (mode === 'depth') {
      out.push(sceneLine(plain[i].scene, locale, d.reversed))
      const suit = suitSphereLine(a.cards[i], spreadId, a.topic, locale)
      if (suit) out.push(suit)
    }
    if (mode !== 'quick') {
      if (d.reversed) out.push(reversedNote(locale))
      if (i > 0) out.push(pair(i))
    }
    if (mode === 'depth') out.push(otherSideLine(plain[i].up, plain[i].rev, d.reversed, locale))
    out.push(tipLine(tips[i], locale))
    return { label: labels[i], card: names[i], reversed: d.reversed, meaning: mode === 'quick' ? sentence(what(i)) : role(i), detail: out.join(' ') }
  })

  // текст збирається з абзаців; кожен абзац — речення, з’єднані пробілом (або рядки через \n)
  const blocks: string[] = []
  if (mode === 'quick') {
    blocks.push(head.join(' '), `${keyLine(names[key], what(key), locale)} ${tipLine(tips[key], locale)}`)
  } else if (mode === 'detailed') {
    blocks.push(head.join(' '))
    if (single) {
      // одна карта: її роль уже є в рядку, тож без окремого «головна карта»
      blocks.push([role(0), ...(drawn[0].reversed ? [reversedNote(locale)] : []), tipLine(tips[0], locale)].join(' '))
    } else {
      blocks.push(drawn.map((_, i) => role(i)).join('\n'))
      const extra = [...(spreadId === 'relationship' || spreadId === 'career' ? insightLines(spreadId, a, names, locale) : []), ...parts.structure.slice(0, 2)]
      if (extra.length) blocks.push(extra.join(' '))
      blocks.push(`${keyLine(names[key], what(key), locale)} ${tipLine(tips[key], locale)}`)
    }
  } else {
    const echo = questionEcho(question, locale)
    // «сфера питання» має сенс, коли карт кілька: для однієї карти вона була б однослівним «не збіглося»
    const lens = single ? '' : parts.lens
    if (echo || lens) blocks.push([echo, lens].filter(Boolean).join(' '))
    blocks.push(head.join(' '))
    const seenSuits = new Set<number>()
    let notedReversed = false
    drawn.forEach((_, i) => {
      const lines = [role(i), sceneLine(scenes[i], locale, drawn[i].reversed)]
      const c = a.cards[i]
      if (c.suit >= 0 && !seenSuits.has(c.suit)) {
        seenSuits.add(c.suit)
        const suit = suitSphereLine(c, spreadId, a.topic, locale)
        if (suit) lines.push(suit)
      }
      if (drawn[i].reversed && !notedReversed) {
        notedReversed = true
        lines.push(reversedNote(locale))
      }
      blocks.push(lines.join(' '))
    })
    const links = drawn.map((_, i) => (i > 0 ? pair(i) : '')).filter(Boolean)
    if (links.length) blocks.push(links.join(' '))
    const patterns = [...parts.structure, ...parts.combos]
    if (patterns.length) blocks.push(patterns.join(' '))
    blocks.push(single ? outlookLine(spreadId, names, tips, locale) : `${outlookLine(spreadId, names, tips, locale)} ${watchLine(a, names, scenes, locale)}`)
    blocks.push(questionLines(spreadId, names, locale).join('\n'))
    blocks.push(single ? practiceLine('', locale, true) : `${practiceLine(tips[key], locale)} ${closingLine(a.tone, a.seed, locale)}`, trustLine(locale))
  }
  const summary = blocks.filter(Boolean).join('\n\n')
  return { positions, summary, ...(spreadId === 'yesno' ? { verdict: verdictFromValence(a.cards[0].valence) } : {}) }
}
