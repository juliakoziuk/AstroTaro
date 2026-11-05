// Єдина точка генерації відповіді: модель (якщо налаштована) з багатим контекстом, інакше — локальний асистент.
import { Locale } from '../i18n/locale'
import { UserContext, systemPrompt } from './context'
import { localReply } from './local'
import { pickProvider, Turn } from './providers'
import { detectTopics } from './topics'

export interface GenerateReplyInput {
  persona: string
  text: string
  history: Turn[] // розмова з цією персоною, разом із щойно надісланим повідомленням
  ctx: UserContext
  locale: Locale
  env: Record<string, string | undefined>
  fetchFn?: typeof fetch
  now?: Date
  rng?: () => number
  onProviderError?: (e: Error) => void
}

export interface AssistantReply {
  text: string
  source: 'ai' | 'local'
}

export async function generateReply(i: GenerateReplyInput): Promise<AssistantReply> {
  const now = i.now ?? new Date()
  const local = () => ({ text: localReply({ persona: i.persona, text: i.text, locale: i.locale, history: i.history.slice(0, -1), ctx: i.ctx, now, rng: i.rng }), source: 'local' as const })

  // у кризовій ситуації відповідь завжди обережна й детермінована, а не залежить від моделі
  if (detectTopics(i.text)[0] === 'crisis') return local()

  const provider = pickProvider(i.env)
  if (!provider) return local()
  try {
    const text = await provider.generate({ system: systemPrompt(i.persona, i.ctx, i.locale, now), turns: i.history, fetchFn: i.fetchFn })
    return { text: text.trim(), source: 'ai' }
  } catch (e) {
    i.onProviderError?.(e as Error)
    return local()
  }
}
