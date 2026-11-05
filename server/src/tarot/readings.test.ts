import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict'
import { CARD_COUNT, cardOf } from './cards'
import { draw, interpret, SPREAD_IDS, spreadsFor } from './readings'

const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)

test('the deck has 78 uniquely named cards', () => {
  strictEqual(CARD_COUNT, 78)
  strictEqual(new Set(Array.from({ length: CARD_COUNT }, (_, i) => cardOf(i, 'en').name)).size, 78)
})

test('every spread lists its position labels', () => {
  deepStrictEqual(spreadsFor('en').find((s) => s.id === 'three')!.positions, ['Past', 'Present', 'Future'])
  strictEqual(SPREAD_IDS.length, 7)
})

test('draw picks distinct cards, one per position', () => {
  const cards = draw('three', seeded(7))
  strictEqual(cards.length, 3)
  strictEqual(new Set(cards.map((c) => c.id)).size, 3)
  for (const c of cards) ok(c.id >= 0 && c.id <= 77 && typeof c.reversed === 'boolean')
})

test('draw is deterministic for a given random source', () => {
  deepStrictEqual(draw('three', seeded(3)), draw('three', seeded(3)))
})

test('unknown spread is rejected', () => {
  throws(() => draw('nope', seeded(1)))
})

test('interpret labels each card with its position and writes a summary', () => {
  const cards = draw('three', seeded(11))
  const r = interpret('three', cards, 'quick', 'en')
  deepStrictEqual(r.positions.map((p) => p.label), ['Past', 'Present', 'Future'])
  for (const p of r.positions) ok(p.card.length > 0 && p.meaning.length > 0)
  ok(r.summary.length > 0)
})

test('deeper modes give a longer summary', () => {
  const cards = draw('three', seeded(5))
  ok(interpret('three', cards, 'depth', 'en').summary.length > interpret('three', cards, 'quick', 'en').summary.length)
})

const locales = ['en', 'uk', 'es'] as const
const modes = ['quick', 'detailed', 'depth'] as const

test('every spread, mode and language produces clean text for many random draws', () => {
  for (const id of SPREAD_IDS)
    for (let seed = 1; seed <= 40; seed++)
      for (const l of locales)
        for (const m of modes) {
          const r = interpret(id, draw(id, seeded(seed)), m, l, 'my love life and relationship')
          for (const text of [r.summary, ...r.positions.map((p) => p.meaning)]) ok(!/undefined|\{|\}|NaN/.test(text), `${id}/${l}/${m}: ${text}`)
        }
})

test('the same cards always read the same way', () => {
  const cards = draw('three', seeded(9))
  deepStrictEqual(interpret('three', cards, 'depth', 'uk'), interpret('three', cards, 'depth', 'uk'))
})

test('a named pair is recognised in either order', () => {
  const tower = { id: 16, reversed: false }
  const star = { id: 17, reversed: false }
  for (const cards of [[tower, star, { id: 3, reversed: false }], [star, { id: 3, reversed: false }, tower]]) {
    const text = interpret('three', cards, 'depth', 'en').summary
    ok(text.includes('The Tower with The Star'), text)
  }
})

test('the story arc follows how the cards feel from position to position', () => {
  const sun = { id: 19, reversed: false }
  const tower = { id: 16, reversed: false }
  const rising = interpret('three', [tower, { id: 13, reversed: false }, sun], 'quick', 'en').summary
  ok(rising.includes('climbs'), rising)
  const falling = interpret('three', [sun, { id: 13, reversed: false }, tower], 'quick', 'en').summary
  ok(falling.includes('slides'), falling)
})

test('the question steers the reading and a reversed card is explained', () => {
  const cups = { id: 22 + 14 + 2, reversed: true } // Three of Cups, reversed
  const text = interpret('three', [{ id: 16, reversed: false }, cups, { id: 19, reversed: false }], 'depth', 'en', 'will my relationship work out?')
  ok(text.summary.includes('love and relationships') && text.summary.includes('Three of Cups'), text.summary)
  ok(text.positions[1].detail.includes('Reversed, this energy'), text.positions[1].detail)
})

test('repeated numbers are noted', () => {
  const fives = [22 + 4, 22 + 14 + 4, 3].map((id) => ({ id, reversed: false }))
  ok(interpret('three', fives, 'depth', 'en').summary.includes('same number appears more than once'))
})

test('in a major and minor pair the major card sets the theme whichever comes first', () => {
  const minorFirst = interpret('three', [{ id: 22 + 14 + 8, reversed: false }, { id: 17, reversed: false }, { id: 3, reversed: false }], 'detailed', 'en')
  ok(minorFirst.positions[1].detail.includes('The Star sets the theme and Nine of Cups shows'), minorFirst.positions[1].detail)
})

test('cards the person drew themselves are accepted only when they fit the spread', async () => {
  const { chosen } = await import('./readings')
  deepStrictEqual(chosen('three', [{ id: 3, reversed: false }, { id: 40, reversed: true }, { id: 77, reversed: false }]), [{ id: 3, reversed: false }, { id: 40, reversed: true }, { id: 77, reversed: false }])
  throws(() => chosen('three', [{ id: 3, reversed: false }]), /count/)
  throws(() => chosen('three', [{ id: 3, reversed: false }, { id: 3, reversed: true }, { id: 4, reversed: false }]), /duplicate/)
  throws(() => chosen('three', [{ id: 3, reversed: false }, { id: 78, reversed: true }, { id: 4, reversed: false }]), /range/)
})

test('the yes/no spread draws one card and answers from how the card feels', async () => {
  const { verdictOf } = await import('./analysis')
  strictEqual(draw('yesno', seeded(2)).length, 1)
  deepStrictEqual(verdictOf({ id: 19, reversed: false }), { answer: 'yes', strength: 'strong' }) // Сонце
  deepStrictEqual(verdictOf({ id: 16, reversed: false }), { answer: 'no', strength: 'strong' }) // Вежа
  deepStrictEqual(verdictOf({ id: 19, reversed: true }), { answer: 'no', strength: 'leaning' }) // перевернуте Сонце
  deepStrictEqual(verdictOf({ id: 16, reversed: true }), { answer: 'yes', strength: 'leaning' }) // перевернута Вежа
  strictEqual(verdictOf({ id: 9, reversed: false }).answer, 'maybe') // Відлюдник: ні так, ні ні
})

test('a yes/no reading opens with the verdict, in every language, and reports it', () => {
  const sun = [{ id: 19, reversed: false }]
  const en = interpret('yesno', sun, 'quick', 'en')
  ok(en.summary.startsWith('The answer is a clear yes'), en.summary)
  deepStrictEqual(en.verdict, { answer: 'yes', strength: 'strong' })
  ok(interpret('yesno', sun, 'quick', 'uk').summary.startsWith('Відповідь — чітке «так»'))
  ok(interpret('yesno', sun, 'quick', 'es').summary.startsWith('La respuesta es un sí rotundo'))
  strictEqual(interpret('three', [{ id: 1, reversed: false }, { id: 2, reversed: false }, { id: 3, reversed: false }], 'quick', 'en').verdict, undefined)
})

test('the three modes read differently in kind, not only in length', () => {
  const cards = [{ id: 16, reversed: false }, { id: 22 + 14 + 8, reversed: true }, { id: 17, reversed: false }]
  const [q, d, p] = (['quick', 'detailed', 'depth'] as const).map((m) => interpret('three', cards, m, 'en', 'will it work out?'))
  // рядки в списку: швидко — лише суть карти, докладно й глибоко — речення про її роль у позиції
  ok(!q.positions[0].meaning.startsWith('Behind you'), q.positions[0].meaning)
  ok(d.positions[0].meaning.startsWith('Behind you') && d.positions[0].meaning === p.positions[0].meaning)
  // деталі карти: швидко — коротко, докладно — зв’язок із сусідньою картою, глибоко — ще й дар і тінь та запитання
  ok(q.positions[1].detail.length < d.positions[1].detail.length && d.positions[1].detail.length < p.positions[1].detail.length)
  ok(!d.positions[1].detail.includes('shadow') && p.positions[1].detail.includes('shadow') && p.positions[1].detail.includes('?'))
  // загальний текст: швидко — суть, докладно — по картах, глибоко — ще й дар/тінь, запитання й вправа
  ok(!q.summary.includes('Behind you') && d.summary.includes('Behind you') && p.summary.includes('Behind you'))
  ok(!d.summary.includes('gift') && p.summary.includes('gift') && p.summary.includes('?'))
  ok(q.summary.length < d.summary.length && d.summary.length < p.summary.length)
})

test('the mode instructions for the model differ in structure, not just a word count', async () => {
  const { readingSystemPrompt } = await import('./ai')
  const [q, d, p] = (['quick', 'detailed', 'depth'] as const).map((m) => readingSystemPrompt('en', m))
  ok(q.includes('Do not go through the cards one by one'))
  ok(d.includes('one short paragraph for each card') && !d.includes('symbolism'))
  ok(p.includes('symbolism') && p.includes('shadow') && p.includes('reflection') && p.includes('practice'))
  ok(new Set([q, d, p]).size === 3)
})
