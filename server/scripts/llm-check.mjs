// Перевірка, що налаштована модель відповідає: node --env-file=.env scripts/llm-check.mjs  (з папки server, після npm run build)
// Показує, який провайдер обрано (Claude чи OpenAI-сумісний), і друкує відповідь на тестове повідомлення.
import { pickProvider } from '../dist/companion/providers.js'
import { astroSystemPrompt } from '../dist/astrology/ai.js'

const provider = pickProvider(process.env)
if (!provider) {
  console.log('Модель не налаштована: задайте ANTHROPIC_API_KEY або LLM_BASE_URL + LLM_MODEL у server/.env (див. .env.example).')
  console.log('Зараз тексти астрології, таро й снів шаблонні, без моделі.')
  process.exit(0)
}
console.log(`Провайдер: ${provider.kind}`)
const started = Date.now()
try {
  const text = await provider.generate({
    system: astroSystemPrompt('day', 'uk'),
    turns: [{ role: 'user', content: 'Сонце у Раку, Місяць у Леві. Меркурій увійшов у Скорпіон. Що це означає для мене сьогодні?' }],
  })
  console.log(`Відповідь за ${((Date.now() - started) / 1000).toFixed(1)} с:\n\n${text}`)
} catch (e) {
  console.error(`Помилка: ${e.message}`)
  process.exit(1)
}
