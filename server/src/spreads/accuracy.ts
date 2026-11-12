/** Через скільки днів після розкладу застосунок питає, чи збулося. */
export const OUTCOME_DUE_DAYS = 7
export const OUTCOMES = ['yes', 'partly', 'no'] as const
export type Outcome = (typeof OUTCOMES)[number]

const DAY_MS = 24 * 60 * 60 * 1000

/** Пора питати: відповіді ще немає, а розкладу вже тиждень. */
export const isOutcomeDue = (row: { date: Date | string; outcome?: string | null }, now = new Date()) =>
  !row.outcome && now.getTime() - new Date(row.date).getTime() >= OUTCOME_DUE_DAYS * DAY_MS

export interface AccuracyRow {
  date: Date | string
  outcome?: string | null
  cards: { id: number }[]
}

/**
 * «Твої розклади в цифрах»: скільки відповідей, скільки збулося повністю, частково чи ні, скільки розкладів чекають
 * на відповідь і які карти випадають найчастіше. rate — частка збулося (часткове рахується за половину), у відсотках;
 * null, поки відповідей немає. Висновки про «влучність» робить клієнт лише від певної кількості відповідей.
 */
export function accuracyOf(rows: AccuracyRow[], now = new Date()) {
  const count = { yes: 0, partly: 0, no: 0 }
  const seen = new Map<number, number>()
  let waiting = 0
  for (const r of rows) {
    if (r.outcome && r.outcome in count) count[r.outcome as Outcome] += 1
    else if (isOutcomeDue(r, now)) waiting += 1
    for (const c of r.cards ?? []) seen.set(c.id, (seen.get(c.id) ?? 0) + 1)
  }
  const answered = count.yes + count.partly + count.no
  const topCards = [...seen]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([id, n]) => ({ id, count: n }))
  return {
    total: rows.length,
    answered,
    ...count,
    waiting,
    rate: answered ? Math.round(((count.yes + count.partly / 2) / answered) * 100) : null,
    topCards,
  }
}
