// Перевірка, що налаштована модель відповідає: node --env-file=.env scripts/llm-check.mjs  (з папки server, після npm run build)
// Показує, який провайдер обрано (Claude чи OpenAI-сумісний), і друкує відповідь на тестове повідомлення.
import { pickProvider } from '../dist/companion/providers.js'
import { systemPrompt } from '../dist/companion/context.js'

const provider = pickProvider(process.env)
if (!provider) {
  console.log('Модель не налаштована: задайте ANTHROPIC_API_KEY або LLM_BASE_URL + LLM_MODEL у server/.env (див. .env.example).')
  console.log('Зараз відповідає локальний асистент.')
  process.exit(0)
}
console.log(`Провайдер: ${provider.kind}`)
const ctx = { name: 'Юля', sunSign: 'Cancer', moonSign: 'Leo', transits: [{ planet: 'Mercury', sign: 'Scorpio' }] }
const started = Date.now()
try {
  const text = await provider.generate({
    system: systemPrompt('Life Coach', ctx, 'uk', new Date()),
    turns: [{ role: 'user', content: 'мені сумно і здається, що я вигоріла. що можна зробити?' }],
  })
  console.log(`Відповідь за ${((Date.now() - started) / 1000).toFixed(1)} с:\n\n${text}`)
} catch (e) {
  console.error(`Помилка: ${e.message}`)
  process.exit(1)
}
