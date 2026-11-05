import { Locale, LOCALES } from '../i18n/locale'

type T3 = [string, string, string]
const at = (t: T3, l: Locale) => t[LOCALES.indexOf(l)]

// id персони однаковий усюди (його зберігає база й сесія); назва й опис перекладаються
const PERSONA_TEXT: { id: string; name: T3; description: [string[], string[], string[]]; prompt: string }[] = [
  { id: 'Mystic Guide', name: ['Mystic Guide', 'Містичний провідник', 'Guía Místico'], description: [['Universal answers, life path', 'and inner balance'], ['Універсальні відповіді, життєвий шлях', 'і внутрішній баланс'], ['Respuestas universales, camino de vida', 'y equilibrio interior']], prompt: 'a calm mystical guide who helps with life path and inner balance, speaking in gentle, symbolic and grounded language' },
  { id: 'Tarot Advisor', name: ['Tarot Advisor', 'Порадник з таро', 'Asesor de Tarot'], description: [['Card meanings, spreads', 'and interpretation'], ['Значення карт, розклади', 'і тлумачення'], ['Significado de cartas, tiradas', 'e interpretación']], prompt: 'a tarot advisor who explains card meanings, spreads and interpretation, connecting the cards to the person’s real question' },
  { id: 'Astrologer', name: ['Astrologer', 'Астролог', 'Astrólogo'], description: [['Astrological insights', 'and forecasts'], ['Астрологічні інсайти', 'і прогнози'], ['Perspectivas astrológicas', 'y pronósticos']], prompt: 'an astrologer who gives astrological insights using the person’s natal chart and the current sky' },
  { id: 'Dream Interpreter', name: ['Dream Interpreter', 'Тлумач снів', 'Intérprete de Sueños'], description: [['Dream analysis and symbolism'], ['Аналіз снів і символіка'], ['Análisis de sueños y simbolismo']], prompt: 'a dream interpreter who explains dream symbolism and asks about the feelings in the dream' },
  { id: 'Life Coach', name: ['Life Coach', 'Лайф-коуч', 'Coach de Vida'], description: [['Support, motivation', 'and personal growth'], ['Підтримка, мотивація', 'і особистісне зростання'], ['Apoyo, motivación', 'y crecimiento personal']], prompt: 'a warm, practical life coach who gives support, motivation and small realistic steps for personal growth' },
]

export const PERSONA_IDS: string[] = PERSONA_TEXT.map((p) => p.id)
export const PERSONA_PROMPT: Record<string, string> = Object.fromEntries(PERSONA_TEXT.map((p) => [p.id, p.prompt]))

export const personas = (locale: Locale) =>
  PERSONA_TEXT.map((p) => ({ id: p.id, name: at(p.name, locale), description: p.description[LOCALES.indexOf(locale)] }))
