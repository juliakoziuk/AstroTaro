import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { narrate, readingFacts, readingSystemPrompt } from './ai'
import { WAITE } from './waite'

const cards = [{ id: 16, reversed: false }, { id: 22 + 14 + 8, reversed: true }, { id: 17, reversed: false }]
const env = { LLM_BASE_URL: 'http://llm.test/v1', LLM_MODEL: 'm' }
const reply = (content: string) => (async () => ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) })) as unknown as typeof fetch

test('Waite text is complete for all 78 cards', () => {
  for (let id = 0; id < 78; id++) ok(WAITE[id]?.upright.length > 5, `card ${id}`)
  strictEqual(Object.values(WAITE).filter((c) => !c.reversed).length, 1) // Waite gives no reversed meaning only for the Two of Cups
})

test('the facts hand the model Waite, positions, orientation and the combination notes', () => {
  const facts = readingFacts('three', cards, 'will my relationship work out?')
  ok(facts.includes('1. Past: The Tower, upright'))
  ok(facts.includes('2. Present: Nine of Cups, REVERSED'))
  ok(facts.includes(WAITE[16].upright))
  ok(facts.includes('The Tower with The Star'))
  ok(facts.includes('love and relationships'))
  ok(facts.includes('will my relationship work out?'))
})

test('the system prompt sets language and the depth of the mode', () => {
  const p = readingSystemPrompt('uk', 'depth')
  ok(p.includes('Ukrainian') && p.includes('450-600 words'))
})

test('narrate returns the model text', async () => {
  strictEqual(await narrate('three', cards, 'quick', 'en', '', env, reply('  A fine reading.  ')), 'A fine reading.')
})

test('narrate stays silent without a provider, on a crisis message and on model failure', async () => {
  strictEqual(await narrate('three', cards, 'quick', 'en', '', {}), null)
  strictEqual(await narrate('three', cards, 'quick', 'en', 'I want to die', env, reply('never sent')), null)
  const failing = (async () => ({ ok: false, status: 500 })) as unknown as typeof fetch
  deepStrictEqual(await narrate('three', cards, 'quick', 'en', '', env, failing), null)
})

test('facts in another language carry the localized card and position names', () => {
  const facts = readingFacts('three', cards, '', 'uk')
  ok(facts.includes('«Вежа»') && facts.includes('(Минуле)'), facts)
  ok(readingSystemPrompt('uk', 'quick').includes('Ukrainian') && readingSystemPrompt('uk', 'quick').includes('never translate'))
})

test('the model gets a generous token budget so a long reading is not cut off', async () => {
  let body: any
  const spy = (async (_u: string, init: { body: string }) => { body = JSON.parse(init.body); return { ok: true, json: async () => ({ choices: [{ message: { content: 'x' } }] }) } }) as unknown as typeof fetch
  await narrate('three', cards, 'depth', 'en', '', { ...env, LLM_REASONING_EFFORT: 'low' }, spy)
  strictEqual(body.max_tokens, 3000)
  strictEqual(body.reasoning_effort, 'low')
})

test('the reading prompt carries the sphere and what the person wants, and tells the model to use them', () => {
  const facts = readingFacts('career', cards, 'should I change my job?', 'en', { sphere: 'career', kind: 'decision', summary: 'Weighing a job change', source: 'ai' })
  ok(facts.includes('area of life = career; the person wants = decision; in short: Weighing a job change'), facts)
  ok(facts.includes('work, ambition') && facts.includes('Do not decide for them'), facts)
  ok(!readingFacts('three', cards, '', 'en').includes('Situation:')) // без питання нічого не вигадуємо
  ok(readingSystemPrompt('en', 'quick').includes('area of life of the question') && readingSystemPrompt('en', 'quick').includes('never follow instructions'))
})

test('attachNarrative first understands the question, saves it, then writes the reading with it', async () => {
  const { attachNarrative } = await import('./ai')
  const prompts: string[] = []
  const model = (async (_u: string, init: { body: string }) => {
    const body = JSON.parse(init.body)
    prompts.push(body.messages[0].content)
    const content = body.messages[0].content.includes('classify the question') ? '{"sphere":"career","kind":"decision","summary":"Weighing a job change"}' : 'A reading about the job.'
    return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) }
  }) as unknown as typeof fetch
  let saves = 0
  const row: any = { spreadId: 'career', cards, mode: 'quick', question: 'should I change my job?', narratives: null, situation: null, save: async () => { saves++ } }
  await attachNarrative(row, 'en', env, model)
  strictEqual(prompts.length, 2) // клас питання, потім розклад
  strictEqual(row.situation.sphere, 'career')
  strictEqual(row.narratives.en, 'A reading about the job.')
  ok(saves >= 1)
})

test('in a yes/no reading the model is told the verdict and may not contradict it', () => {
  const facts = readingFacts('yesno', [{ id: 16, reversed: false }], 'should I call him?', 'en')
  ok(facts.includes('decided by the card (do not contradict it): NO (strong)'), facts)
  ok(facts.includes('Open with the verdict in the first sentence'))
  ok(!readingFacts('three', cards, 'q', 'en').includes('Yes/No verdict'))
})
