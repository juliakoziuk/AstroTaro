// Наскрізна перевірка генерації відповідей (потрібні база й зібраний сервер: npm run build): node scripts/assistant-e2e.mjs
// Піднімає підставний OpenAI-сумісний сервіс і другий екземпляр API на вільному порту, з LLM_BASE_URL на цей сервіс.
// Перевіряє, що модель отримує контекст про людину, мову й історію, що відповідь потрапляє в чат із source: "ai",
// що при збої моделі працює локальний асистент (source: "local"), а кризове повідомлення НЕ віддається моделі.
import http from 'node:http'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API_PORT = 3199
const LLM_PORT = 3198
const API = `http://localhost:${API_PORT}/api`
let failed = 0
const check = (name, ok, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${ok ? '' : extra}`)
}

// ---- підставна модель
const seen = []
let mode = 'ok'
const llm = http.createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    seen.push(JSON.parse(body))
    if (mode === 'fail') {
      res.writeHead(500).end('{}')
      return
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ choices: [{ message: { content: 'Відповідь підставної моделі.' } }] }))
  })
})
await new Promise((r) => llm.listen(LLM_PORT, r))

// ---- другий екземпляр API
const server = spawn(process.execPath, ['dist/main.js'], {
  cwd: root,
  env: { ...process.env, PORT: String(API_PORT), LLM_BASE_URL: `http://localhost:${LLM_PORT}/v1`, LLM_MODEL: 'test-model', ANTHROPIC_API_KEY: '' },
  stdio: 'ignore',
})
const stop = () => {
  server.kill()
  llm.close()
}
process.on('exit', stop)
for (let i = 0; i < 60; i++) {
  if (await fetch(`${API}/plans`).then((r) => r.ok, () => false)) break
  await new Promise((r) => setTimeout(r, 500))
}

const call = async (m, p, body, token, lang = 'uk') => {
  const res = await fetch(API + p, { method: m, headers: { 'Content-Type': 'application/json', 'Accept-Language': lang, ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: res.status, data: await res.json() }
}

const email = `assist-${Date.now()}@example.com`
const { data: reg } = await call('POST', '/auth/register', { name: 'Юля', email, password: 'secret123' })
const t = reg.token
await call('PATCH', '/profile', { birthDate: '2004-06-22' }, t)
await call('POST', '/dreams', { title: 'Старий дім', text: 'Я була в старому будинку з дитинства.' }, t)
await call('POST', '/tarot/readings', { spreadId: 'three', deck: 'Classic Tarot', mode: 'quick' }, t)

let r = await call('POST', '/companion/chat', { persona: 'Life Coach', text: 'мені сумно, що можна зробити?' }, t)
check('the model answer is returned with source "ai"', r.status === 201 && r.data.source === 'ai' && r.data.reply.text === 'Відповідь підставної моделі.', JSON.stringify(r.data))
const sent = seen.at(-1)
const system = sent.messages[0].content
check('the model gets the system prompt first and the user turn last', sent.messages[0].role === 'system' && sent.messages.at(-1).role === 'user' && sent.model === 'test-model')
check('the prompt asks for Ukrainian and carries the persona', /Ukrainian/.test(system) && /life coach/i.test(system))
check('the prompt knows the person: name, natal chart, dream, last reading', system.includes('Юля') && /Sun in Cancer/.test(system) && /Old house|Старий дім/.test(system) && /Last tarot reading/.test(system), system)
check('the prompt has the safety rule', /crisis line|emergency/i.test(system))

r = await call('POST', '/companion/chat', { persona: 'Life Coach', text: 'дякую, а що далі?' }, t)
const second = seen.at(-1).messages
check('the earlier turns are sent as history, in order', second.filter((m) => m.role === 'user').length === 2 && second.some((m) => m.role === 'assistant'), JSON.stringify(second.map((m) => m.role)))

const before = seen.length
r = await call('POST', '/companion/chat', { persona: 'Life Coach', text: 'я не хочу жити' }, t)
check('a crisis message is answered safely and is NOT sent to the model', r.data.source === 'local' && r.data.reply.text.includes('112') && seen.length === before, JSON.stringify(r.data))

mode = 'fail'
r = await call('POST', '/companion/chat', { persona: 'Life Coach', text: 'мені важко на роботі' }, t)
check('when the model fails the local assistant answers (source "local")', r.status === 201 && r.data.source === 'local' && r.data.reply.text.length > 20, JSON.stringify(r.data))

stop()
console.log(failed ? `\n${failed} FAILED (user ${email})` : `\nall passed (user ${email})`)
process.exit(failed ? 1 : 0)
