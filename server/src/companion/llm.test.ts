import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { normalizeTurns, pickProvider } from './providers'
import { detectTopics } from './topics'

// ---------- теми ----------
test('asking for advice is recognised in all languages', () => {
  ok(detectTopics('що мені робити?').includes('advice'))
  ok(detectTopics('can you give me some advice').includes('advice'))
  ok(detectTopics('потрібна порада').includes('advice'))
})

test('topics are found in English and Ukrainian, with crisis first', () => {
  ok(detectTopics('мені сумно і печально, вигоріла').includes('sadness'))
  ok(detectTopics('мені сумно і печально, вигоріла').includes('burnout'))
  ok(detectTopics('I feel anxious about tomorrow').includes('anxiety'))
  ok(detectTopics('I feel so exhausted and drained').includes('burnout'))
  strictEqual(detectTopics('мені сумно, я не хочу жити')[0], 'crisis')
  strictEqual(detectTopics('I want to kill myself')[0], 'crisis')
  strictEqual(detectTopics('хочу померти')[0], 'crisis')
  ok(detectTopics('thank you so much').includes('gratitude'))
  ok(detectTopics('привіт').includes('greeting'))
})

test('a long message with a greeting word is not treated as a greeting', () => {
  ok(!detectTopics('hi, I have been thinking about my job and I do not know what to do next with my career at all').includes('greeting'))
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
