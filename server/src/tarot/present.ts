import { Locale } from '../i18n/locale'
import { Spread } from '../spreads/spread.model'
import { DrawnCard, interpret, Mode, SPREAD_IDS } from './readings'
import { classifyLocal, Situation } from './sphere'

/**
 * Розклад для відповіді: у базі лежать нейтральні дані (id розкладу, id карт, режим), а назви карт, позицій і саме
 * тлумачення рахуються мовою запиту, тож зміна мови перекладає й старі розклади.
 * Розклади зі старих версій (довільний spreadId) віддаємо без тлумачення.
 */
export function presentSpread(row: Spread, locale: Locale) {
  const known = SPREAD_IDS.includes(row.spreadId) && Array.isArray(row.cards)
  const { narratives, situation: saved, ...rest } = row.toJSON()
  if (!known) return { ...rest, result: null }
  const situation = (saved as Situation | null) ?? classifyLocal(row.question)
  const local = interpret(row.spreadId, row.cards as DrawnCard[], (row.mode as Mode) ?? 'quick', locale, row.question, situation)
  const ai = narratives?.[locale]
  return { ...rest, result: { ...local, ...(ai ? { summary: ai, source: 'ai' as const } : { source: 'local' as const }), situation: { sphere: situation.sphere, kind: situation.kind, summary: situation.summary } } }
}
