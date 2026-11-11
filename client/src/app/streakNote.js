import { t } from '../i18n/index.js'

/** Що сказати про серію: підбадьорення, поки сьогоднішню карту не відкрито, і спокій, коли відкрито. */
export function streakNote({ current, drawnToday }) {
  if (drawnToday) return t('Streak kept for today. Come back tomorrow for a new card.')
  return current > 0 ? t('Open today’s card to keep your streak going.') : t('Start a streak: open your first card of the day.')
}
