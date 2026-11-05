// Що асистент знає про людину і як це стає підказкою для моделі. Дані (UserContext) збирає сервіс із бази;
// тут лише чисті функції, тож їх просто перевіряти. Контекст для моделі англійською (мову відповіді задає окремий рядок).
import { LANGUAGE_NAME, Locale } from '../i18n/locale'
import { PERSONA_PROMPT } from './personas'

export interface UserContext {
  name: string
  sunSign?: string // англійські ідентифікатори знаків і планет
  moonSign?: string
  ascendant?: string | null
  transits?: { planet: string; sign: string }[]
  dreams?: { title: string; symbols: string[] }[]
  lastReading?: { spread: string; cards: string[] } | null
  moods?: number[] // останні оцінки настрою щоденника, 1–5, від новіших до старіших
}

/** Факти про людину рядками «Назва: значення»; відсутнє пропускаємо. */
export function buildContext(c: UserContext, now: Date): string {
  const lines = [`Today: ${now.toISOString().slice(0, 10)}`, `Name: ${c.name}`]
  if (c.sunSign) lines.push(`Natal chart: Sun in ${c.sunSign}${c.moonSign ? `, Moon in ${c.moonSign}` : ''}${c.ascendant ? `, Ascendant in ${c.ascendant}` : ''}`)
  if (c.transits?.length) lines.push(`Current sky: ${c.transits.map((t) => `${t.planet} in ${t.sign}`).join(', ')}`)
  if (c.dreams?.length) lines.push(`Recent dreams: ${c.dreams.map((d) => `“${d.title}”${d.symbols.length ? ` (${d.symbols.join(', ')})` : ''}`).join('; ')}`)
  if (c.lastReading) lines.push(`Last tarot reading (${c.lastReading.spread}): ${c.lastReading.cards.join(', ')}`)
  if (c.moods?.length) lines.push(`Recent journal moods (1 low – 5 high, newest first): ${c.moods.join(', ')}`)
  return lines.join('\n')
}

/** Системна підказка: роль персони, мова, правила поведінки, безпека й відомий контекст. */
export function systemPrompt(persona: string, c: UserContext, locale: Locale, now: Date): string {
  return [
    `You are ${PERSONA_PROMPT[persona] ?? PERSONA_PROMPT['Mystic Guide']}, inside the AstroTarot app. Always answer in ${LANGUAGE_NAME[locale]}.`,
    'How to answer:',
    '- Respond to what the person actually wrote; acknowledge the feeling first, then offer one useful idea or a small concrete step.',
    '- Be warm, concise (about 60–120 words) and natural; do not repeat earlier replies or open the same way every time.',
    '- Use the known context only where it genuinely helps, and never read it back like a list.',
    '- Tarot, astrology and dream symbolism are tools for reflection: frame them as perspectives, never as certain predictions or fate.',
    '- You are not a medical or therapy service and you give no diagnoses. If the person mentions self-harm, suicide or being in danger, respond with care, encourage contacting local emergency services or a crisis line and a trusted person, and stay supportive.',
    '- End with one gentle question only when it moves the conversation forward.',
    '',
    'What is known about the person:',
    buildContext(c, now),
  ].join('\n')
}
