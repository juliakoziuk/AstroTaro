// Постачальники відповідей. Claude (ANTHROPIC_API_KEY) або будь-який OpenAI-сумісний сервіс (LLM_BASE_URL + LLM_MODEL
// [+ LLM_API_KEY]): Ollama на власному комп'ютері, Gemini, Groq, OpenRouter, Mistral тощо. Нічого не задано — null.
export interface Turn {
  role: 'user' | 'assistant'
  content: string
}

export interface GenerateInput {
  system: string
  turns: Turn[]
  fetchFn?: typeof fetch // підміняється в тестах
  maxTokens?: number // за замовчуванням 700; довгі тлумачення й моделі з «міркуванням» потребують більше
}

export interface Provider {
  kind: 'anthropic' | 'openai'
  generate(input: GenerateInput): Promise<string>
}

type Env = Record<string, string | undefined>
const TIMEOUT_MS = 30_000

/** Anthropic вимагає, щоб розмова починалась з користувача й ролі чергувались: зливаємо сусідні однакові. */
export function normalizeTurns(turns: Turn[]): Turn[] {
  const out: Turn[] = []
  for (const t of turns) {
    const last = out[out.length - 1]
    if (last?.role === t.role) last.content += `\n${t.content}`
    else out.push({ ...t })
  }
  while (out[0]?.role === 'assistant') out.shift()
  return out
}

async function post(fetchFn: typeof fetch, url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetchFn(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`LLM ${res.status}`)
  return res.json()
}

const anthropic = (key: string, model: string): Provider => ({
  kind: 'anthropic',
  async generate({ system, turns, fetchFn = fetch, maxTokens = 700 }) {
    const data = (await post(fetchFn, 'https://api.anthropic.com/v1/messages', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, { model, max_tokens: maxTokens, system, messages: normalizeTurns(turns) })) as { content?: { type: string; text?: string }[] }
    const text = data.content?.find((c) => c.type === 'text')?.text
    if (!text) throw new Error('Empty AI reply')
    return text
  },
})

const openai = (base: string, model: string, key?: string, reasoningEffort?: string): Provider => ({
  kind: 'openai',
  async generate({ system, turns, fetchFn = fetch, maxTokens = 700 }) {
    const data = (await post(fetchFn, `${base.replace(/\/$/, '')}/chat/completions`, key ? { authorization: `Bearer ${key}` } : {}, { model, max_tokens: maxTokens, ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}), messages: [{ role: 'system', content: system }, ...normalizeTurns(turns)] })) as { choices?: { message?: { content?: string } }[] }
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Empty AI reply')
    return text.trim()
  },
})

export function pickProvider(env: Env): Provider | null {
  if (env.ANTHROPIC_API_KEY) return anthropic(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5')
  if (env.LLM_BASE_URL && env.LLM_MODEL) return openai(env.LLM_BASE_URL, env.LLM_MODEL, env.LLM_API_KEY, env.LLM_REASONING_EFFORT)
  return null
}
