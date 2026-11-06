import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { cardOf } from '../tarot/cards'
import { generateReply } from './assistant'
import { buildContext, systemPrompt, UserContext } from './context'
import { localReply } from './local'
import { normalizeTurns, pickProvider } from './providers'
import { detectTopics } from './topics'

const cyr = /[А-Яа-яІіЇїЄєҐґ]/
const NOW = new Date('2026-11-03T12:00:00Z')
const ctx: UserContext = {
  name: 'Юля',
  sunSign: 'Cancer',
  moonSign: 'Leo',
  ascendant: 'Virgo',
  transits: [{ planet: 'Mercury', sign: 'Scorpio' }],
  dreams: [{ title: 'Old house', symbols: ['House', 'Light'] }],
  lastReading: { spread: 'Three Cards', cards: ['The Moon', 'The Star (reversed)', 'The Sun'] },
  moods: [3, 2, 2],
}
const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)

// ---------- теми ----------
test('asking for advice is recognised in all languages', () => {
  ok(detectTopics('що мені робити?').includes('advice'))
  ok(detectTopics('can you give me some advice').includes('advice'))
  ok(detectTopics('necesito un consejo').includes('advice'))
})

test('topics are found in English, Ukrainian and Spanish, with crisis first', () => {
  ok(detectTopics('мені сумно і печально, вигоріла').includes('sadness'))
  ok(detectTopics('мені сумно і печально, вигоріла').includes('burnout'))
  ok(detectTopics('I feel anxious about tomorrow').includes('anxiety'))
  ok(detectTopics('estoy muy cansada y agotada').includes('burnout'))
  strictEqual(detectTopics('мені сумно, я не хочу жити')[0], 'crisis')
  strictEqual(detectTopics('I want to kill myself')[0], 'crisis')
  strictEqual(detectTopics('quiero morir')[0], 'crisis')
  ok(detectTopics('thank you so much').includes('gratitude'))
  ok(detectTopics('привіт').includes('greeting'))
})

test('a long message with a greeting word is not treated as a greeting', () => {
  ok(!detectTopics('hi, I have been thinking about my job and I do not know what to do next with my career at all').includes('greeting'))
})

// ---------- контекст і підказка ----------
test('the context lists what is known about the person and skips what is not', () => {
  const text = buildContext(ctx, NOW)
  for (const part of ['Юля', 'Sun in Cancer', 'Moon in Leo', 'Ascendant in Virgo', 'Mercury in Scorpio', 'Old house', 'The Moon', '2026-11-03']) ok(text.includes(part), part)
  const bare = buildContext({ name: 'Юля' }, NOW)
  ok(!/Sun in|Recent dreams|Last tarot/.test(bare))
})

test('the system prompt carries the persona, the language, the person and a safety rule', () => {
  const p = systemPrompt('Astrologer', ctx, 'uk', NOW)
  ok(/astrologer/i.test(p) && /Ukrainian/.test(p) && p.includes('Юля') && /crisis|emergency/i.test(p) && /not (?:a )?(?:medical|therapy)/i.test(p))
})

// ---------- провайдери ----------
test('turns are merged and start with the user, as the Anthropic API requires', () => {
  deepStrictEqual(
    normalizeTurns([
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'a' },
      { role: 'user', content: 'b' },
      { role: 'assistant', content: 'c' },
    ]),
    [
      { role: 'user', content: 'a\nb' },
      { role: 'assistant', content: 'c' },
    ],
  )
})

test('a provider is chosen from the environment: Claude, then any OpenAI-compatible endpoint, else none', () => {
  strictEqual(pickProvider({ ANTHROPIC_API_KEY: 'k' })?.kind, 'anthropic')
  strictEqual(pickProvider({ LLM_BASE_URL: 'http://localhost:11434/v1', LLM_MODEL: 'llama3.1' })?.kind, 'openai')
  strictEqual(pickProvider({ LLM_BASE_URL: 'http://x/v1' }), null) // без моделі працювати нема з чим
  strictEqual(pickProvider({}), null)
})

test('the Anthropic provider sends the system prompt and the turns and returns the text', async () => {
  let seen: { url: string; init: any } | undefined
  const fetchFn = async (url: any, init: any) => {
    seen = { url: String(url), init }
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'Привіт!' }] }) } as Response
  }
  const provider = pickProvider({ ANTHROPIC_API_KEY: 'secret' })!
  const text = await provider.generate({ system: 'SYS', turns: [{ role: 'user', content: 'hi' }], fetchFn })
  strictEqual(text, 'Привіт!')
  const body = JSON.parse(seen!.init.body)
  strictEqual(body.system, 'SYS')
  deepStrictEqual(body.messages, [{ role: 'user', content: 'hi' }])
  strictEqual(seen!.init.headers['x-api-key'], 'secret')
})

test('the OpenAI-compatible provider puts the system prompt first and reads choices[0]', async () => {
  let body: any
  const fetchFn = async (_u: any, init: any) => {
    body = JSON.parse(init.body)
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'Hola' } }] }) } as Response
  }
  const provider = pickProvider({ LLM_BASE_URL: 'http://localhost:11434/v1', LLM_MODEL: 'llama3.1' })!
  strictEqual(await provider.generate({ system: 'SYS', turns: [{ role: 'user', content: 'hi' }], fetchFn }), 'Hola')
  deepStrictEqual(body.messages[0], { role: 'system', content: 'SYS' })
  strictEqual(body.model, 'llama3.1')
})

// ---------- локальний режим ----------
const reply = (text: string, over: Partial<Parameters<typeof localReply>[0]> = {}) =>
  localReply({ persona: 'Life Coach', text, locale: 'uk', history: [], ctx, now: NOW, rng: seeded(3), ...over })

test('the local assistant answers what the person said, not a fixed text', () => {
  const sad = reply('мені сумно, здається, я вигоріла')
  const happy = reply('я така щаслива сьогодні!')
  ok(cyr.test(sad) && cyr.test(happy))
  ok(sad !== happy)
  ok(/сум|важк|втом|вигоран|сил|енерг/i.test(sad), sad)
  ok(/радіс|чудово|приємно|насол|гарн/i.test(happy), happy)
})

test('the same message gets a different reply the next time (no repeating)', () => {
  const first = reply('мені сумно')
  const second = reply('мені сумно', { history: [{ role: 'user', content: 'мені сумно' }, { role: 'assistant', content: first }] })
  ok(first !== second)
})

test('a reply usually ends with a follow-up question, except a farewell', () => {
  ok(reply('мені сумно').trim().endsWith('?'))
  ok(!reply('бувай, дякую').trim().endsWith('?'))
  ok(!reply('до побачення').trim().endsWith('?'))
})

test('a crisis message gets a caring answer with emergency contacts, in every language', () => {
  ok(reply('я не хочу жити').includes('112'))
  ok(reply('I want to end my life', { locale: 'en' }).includes('112'))
  ok(reply('quiero morir', { locale: 'en' }).includes('112'))
})

test('personas keep their own voice: tarot draws a card, astrology uses the sky and the Sun sign', () => {
  const tarot = reply('що мені робити з роботою?', { persona: 'Tarot Advisor' })
  ok(Array.from({ length: 78 }, (_, n) => cardOf(n, 'uk').name).some((name) => tarot.includes(name)), tarot)
  const astro = reply('що чекає цього тижня?', { persona: 'Astrologer' })
  ok(astro.includes('Меркурій') && astro.includes('Рак'), astro)
})

test('the dream interpreter reads the symbols of a dream it is told about', () => {
  const r = reply('мені наснився ліс і море', { persona: 'Dream Interpreter' })
  ok(/Ліс|Вода/.test(r), r)
})

test('the greeting uses the name where it can be used safely (not in Ukrainian, which needs the vocative)', () => {
  ok(reply('hello', { locale: 'en' }).includes('Юля'))
  ok(!reply('привіт').includes('Юля'))
})

test('asking for advice continues the earlier topic and gives two concrete ideas', () => {
  const r = reply('то що ж мені можна зробити? дай пораду', { history: [{ role: 'user', content: 'мені сумно' }, { role: 'assistant', content: 'ok' }] })
  ok(r.includes('склянку води') && r.includes('лагідну дію'), r)
})

test('a message without a topic keeps the topic of the conversation', () => {
  const r = reply('не знаю', { history: [{ role: 'user', content: 'я так втомилась, вигоріла' }, { role: 'assistant', content: 'ok' }] })
  ok(/втом|вигоран|відпочин|сил|енерг/i.test(r), r)
})

test('with two feelings the reply acknowledges the first and gives the step for the second', () => {
  const r = reply('мені сумно і я вигоріла', { history: [] })
  ok(/важко|сумно/.test(r) && /годину|відпочин|сну/.test(r), r)
})

// ---------- оркестратор ----------
test('generateReply uses the provider when there is one and reports the source', async () => {
  const fetchFn = async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'Відповідь від Claude' }] }) }) as Response
  const r = await generateReply({ persona: 'Mystic Guide', text: 'hi', history: [{ role: 'user', content: 'hi' }], ctx, locale: 'uk', env: { ANTHROPIC_API_KEY: 'k' }, fetchFn, now: NOW })
  deepStrictEqual(r, { text: 'Відповідь від Claude', source: 'ai' })
})

test('generateReply falls back to the local assistant when the provider fails', async () => {
  const fetchFn = async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response
  const r = await generateReply({ persona: 'Life Coach', text: 'мені сумно', history: [{ role: 'user', content: 'мені сумно' }], ctx, locale: 'uk', env: { ANTHROPIC_API_KEY: 'k' }, fetchFn, now: NOW })
  strictEqual(r.source, 'local')
  ok(cyr.test(r.text))
})

test('generateReply without any provider answers locally', async () => {
  const r = await generateReply({ persona: 'Life Coach', text: 'мені сумно', history: [], ctx, locale: 'uk', env: {}, now: NOW })
  strictEqual(r.source, 'local')
})
