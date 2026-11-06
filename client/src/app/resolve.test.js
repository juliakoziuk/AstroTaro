import { test } from 'node:test'
import { deepStrictEqual, strictEqual, throws } from 'node:assert/strict'
import { formatDate, formatDay, formatTime, greeting, snippet } from './format.js'
import { bindTexts, fit, fitValue, limitByNeighbours, resolveTexts, wrap } from './resolve.js'

const T = (s, extra = {}) => ({ s, x: 0, y: 0, ...extra })

test('wrap breaks on words within the width and line count', () => {
  deepStrictEqual(wrap('one two three four', 8, 3), ['one two', 'three', 'four'])
})

test('wrap truncates with an ellipsis when text does not fit', () => {
  const rows = wrap('alpha beta gamma delta epsilon', 10, 2)
  strictEqual(rows.length, 2)
  strictEqual(rows[1].endsWith('…'), true)
  strictEqual(rows.every((r) => r.length <= 10), true)
})

test('bindTexts marks the nth match and resolveTexts fills it, never leaking the mock text', () => {
  const texts = [T('Label'), T('Julia'), T('Julia')]
  const bound = bindTexts(texts, [{ find: 'Julia', nth: 1, key: 'user.name' }])
  const out = resolveTexts(bound, { 'user.name': 'Yullia' })
  deepStrictEqual(out.map((t) => t.s), ['Label', 'Julia', 'Yullia'])
  strictEqual(resolveTexts(bound, {})[2].s, '')
})

test('offset binds the text after the one that was found', () => {
  const bound = bindTexts([T('Sun'), T('Cancer')], [{ find: 'Sun', offset: 1, key: 'sun' }])
  deepStrictEqual(resolveTexts(bound, { sun: 'Leo' }).map((t) => t.s), ['Sun', 'Leo'])
})

test('a bound paragraph is re-wrapped into the same line slots', () => {
  const para = [T('A time for self-discovery, new', { p: 'a' }), T('perspectives, and inner balance.', { p: 'a' })]
  const bound = bindTexts(para, [{ find: 'A time for self-discovery, new', lines: 2, key: 'insight' }])
  const out = resolveTexts(bound, { insight: 'Short text here' })
  deepStrictEqual(out.map((t) => t.s), ['Short text here', ''])
  strictEqual(out[1].p, 'a')
})

test('flow spreads one layout line over several lines downward', () => {
  const bound = bindTexts([T('Short', { y: 100, lh: 20 })], [{ find: 'Short', flow: 2, width: 12, key: 'm' }])
  const out = resolveTexts(bound, { m: 'one two three four five' })
  deepStrictEqual(out.map((t) => [t.s, t.y]), [['one two', 100], ['three four…', 120]])
})

test('drop removes layout lines that a live component replaces', () => {
  const texts = [T('keep'), T('Hello'), T('b'), T('c'), T('tail')]
  const bound = bindTexts(texts, [{ find: 'Hello', drop: 3 }])
  deepStrictEqual(bound.map((t) => t.s), ['keep', 'tail'])
})

test('translations that are only slightly longer keep their size, much longer ones shrink (never below 70%)', () => {
  strictEqual(fit(T('Home', { fs: 20 }), 'Головна').fs, 20)
  const long = fit(T('Track your growth', { fs: 20 }), 'Стеж за своїм зростанням')
  strictEqual(long.fs < 20 && long.fs >= 14, true)
  strictEqual(fit(T('Hi', { fs: 20 }), 'x'.repeat(60)).fs, 14)
  strictEqual(fit(T('Hi', { fs: 20 }), 'Hi').fs, 20)
})

test('sidebar labels never grow past the sidebar edge', () => {
  const t = T('Settings', { x: 127, fs: 20 })
  const out = fit(t, 'Налаштування')
  strictEqual(127 + 'Налаштування'.length * out.fs * 0.5 <= 236 + 1, true)
  strictEqual(fit(T('Settings', { x: 127, fs: 20 }), 'Ajustes').fs, 20)
})

test('a text must end before a button to its right on the same row', () => {
  const texts = [T('Long description', { x: 100, y: 50, fs: 20, lh: 24 }), T('Other row', { x: 100, y: 200, fs: 20, lh: 24 })]
  const out = limitByNeighbours(texts, [{ x: 300, y: 40, w: 100, h: 60 }])
  strictEqual(out[0].maxw, 190)
  strictEqual(out[1].maxw, undefined)
  strictEqual(fit(out[0], 'x'.repeat(40)).fs < 20, true)
})

test('a static text must not run into the next text on the same line', () => {
  const texts = [
    T('I agree to the', { x: 731, y: 646, fs: 24.7, lh: 32 }),
    T('Terms of Service', { x: 871, y: 646, fs: 24.7, lh: 32 }),
    T('and', { x: 731, y: 680, fs: 24.7, lh: 32 }),
  ]
  const out = limitByNeighbours(texts, [])
  strictEqual(out[0].maxw, 871 - 731 - 8) // до початку сусіда
  strictEqual(out[1].maxw, undefined) // праворуч нікого
  strictEqual(out[2].maxw, undefined) // інший рядок
  const longer = fit(out[0], 'Я погоджуюсь з')
  strictEqual(longer.fs < 24.7, true)
  strictEqual(731 + 'Я погоджуюсь з'.length * longer.fs * 0.5 <= 871, true)
  strictEqual(fit(out[0], 'I agree to the').fs, 24.7) // оригінал не чіпаємо
})

test('a text inside a card must end before the right edge of that card', () => {
  const texts = [T('AI Companion', { x: 447.7, y: 606, fs: 30.31, lh: 39.4 }), T('Left of card', { x: 100, y: 606, fs: 20, lh: 24 })]
  const out = limitByNeighbours(texts, [{ x: 283, y: 585, w: 370, h: 124 }])
  strictEqual(Math.round(out[0].maxw), 193) // 283 + 370 - 447.7 - 12
  strictEqual(out[1].maxw, 173) // текст зліва від картки закінчується до її початку (100 + 173 + 10 = 283)
  const bound = [{ ...T('Value', { x: 447.7, y: 606, fs: 20, lh: 24 }), dyn: 'v' }]
  strictEqual(limitByNeighbours(bound, [{ x: 283, y: 585, w: 370, h: 124 }])[0].maxw, undefined) // значення мають власний maxw
})

test('a bound value keeps its own width limit and is not squeezed by a neighbour', () => {
  const texts = [{ ...T('Cancer', { x: 100, y: 50, fs: 20, lh: 24 }), dyn: 'sign', maxw: 56 }, T('Label', { x: 130, y: 50, fs: 20, lh: 24 })]
  strictEqual(limitByNeighbours(texts, [])[0].maxw, 56)
})

test('a binding can shrink the font of a line so two wrapped lines fit their block', () => {
  const bound = bindTexts([T('A time of uncertainty', { x: 100, y: 50, fs: 21.13, lh: 27.47 })], [{ find: 'A time of uncertainty', key: 'm', flow: 2, width: 46, fs: 18.5, lh: 23 }])
  const rows = resolveTexts(bound, { m: 'word '.repeat(14).trim() })
  strictEqual(rows.length, 2)
  strictEqual(rows[0].fs, 18.5)
  strictEqual(rows[1].y - rows[0].y, 23) // другий рядок — на висоту зменшеного рядка, а не початкового
})

test('a description is wrapped into balanced lines that share one font size (a group)', () => {
  const bound = bindTexts(
    [T('Universal answers, life path', { x: 100, y: 50, fs: 17, lh: 22 }), T('and inner balance', { x: 100, y: 72, fs: 17, lh: 22 })],
    [{ find: 'Universal answers, life path', key: 'd', flow: 2, balance: true, maxw: 200, group: 'p0' }, { find: 'and inner balance', drop: 1 }],
  )
  strictEqual(bound.length, 1) // другий рядок макета замінює перенос за словами
  const rows = resolveTexts(bound, { d: 'Універсальні відповіді, життєвий шлях і внутрішній баланс' })
  strictEqual(rows.length, 2)
  strictEqual(Math.abs(rows[0].s.length - rows[1].s.length) < 14, true) // рядки приблизно однакові, а не довгий + огризок
  strictEqual(rows[0].g, 'p0')
  strictEqual(rows[1].g, 'p0')
  strictEqual(rows[0].maxw, 200)
  strictEqual(rows[0].fs, 17) // кегль рядків не міняємо тут: групу підганяє сторінка за справжньою шириною
  strictEqual(rows[1].fs, 17)
})

test('a balanced description uses as few lines as it can and only goes to three for a long one', () => {
  const spec = [{ find: 'Desc', key: 'd', flow: 3, balance: true, maxw: 205, group: 'g' }]
  const base = [T('Desc', { x: 0, y: 0, fs: 17.08, lh: 22.2 })]
  const short = resolveTexts(bindTexts(base, spec), { d: 'Значення карт, розклади і тлумачення' })
  strictEqual(short.length, 2)
  const long = resolveTexts(bindTexts(base, spec), { d: 'Універсальні відповіді, життєвий шлях і внутрішній баланс' })
  strictEqual(long.length, 3)
  strictEqual(long.every((r) => r.s.length <= 30), true)
  strictEqual(resolveTexts(bindTexts(base, spec), { d: 'Аналіз снів' }).length, 1)
})

test('a value with rx is right-aligned at that x', () => {
  const bound = bindTexts([T('Cancer', { x: 100, fs: 20 })], [{ find: 'Cancer', key: 'sign', rx: 300 }])
  const out = resolveTexts(bound, { sign: 'Sagittarius' })[0]
  strictEqual(out.x, 300)
  strictEqual(out.ralign, true)
})

test('a value with maxw shrinks to fit that width, but never below 60%', () => {
  const t = T('Cancer', { fs: 20, maxw: 60 })
  strictEqual(fitValue(t, 'Leo').fs, 20)
  strictEqual(fitValue(t, 'Близнюки').fs, 15)
  strictEqual(fitValue(t, 'x'.repeat(40)).fs, 12)
})

test('binding a missing text fails loudly', () => {
  throws(() => bindTexts([T('x')], [{ find: 'nope', key: 'k' }]), /не знайдено/)
})

test('dates follow the chosen format', () => {
  strictEqual(formatDate('2026-10-28T10:00:00', 'DD/MM/YYYY'), '28/10/2026')
  strictEqual(formatDate('2026-10-28T10:00:00', 'MM/DD/YYYY'), '10/28/2026')
  strictEqual(formatDate('2026-10-28T10:00:00', 'YYYY-MM-DD'), '2026-10-28')
  strictEqual(formatDay('2004-06-22', 'DD/MM/YYYY'), '22/06/2004')
  strictEqual(formatDate(null), '')
})

test('time follows 24-hour or 12-hour', () => {
  strictEqual(formatTime('2026-10-28T15:42:00', '24-hour'), '15:42')
  strictEqual(formatTime('2026-10-28T15:42:00', '12-hour'), '3:42 PM')
  strictEqual(formatTime('2026-10-28T00:05:00', '12-hour'), '12:05 AM')
})

test('time can be shown in the zone of another place', () => {
  strictEqual(formatTime('2026-11-03T04:52:03+00:00', '24-hour', 'Europe/Kyiv'), '06:52')
})

test('greeting depends on the hour and snippet shortens long text', () => {
  strictEqual(greeting(new Date('2026-01-01T09:00:00')), 'Good morning,')
  strictEqual(greeting(new Date('2026-01-01T20:00:00')), 'Good evening,')
  strictEqual(snippet('short'), 'short')
  strictEqual(snippet('x'.repeat(50), 10), 'xxxxxxxxx…')
})
