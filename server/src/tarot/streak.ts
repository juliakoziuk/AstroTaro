// Серія днів «карти дня»: лічимо календарні дні (рядки РРРР-ММ-ДД), а не години, тож серія не залежить від часового поясу людини.
const DAY_MS = 864e5
const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/

const toMs = (day: string) => Date.parse(`${day}T00:00:00Z`)
const toDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Дата існує в календарі (а не «2026-02-31»). */
export const isRealDay = (day: string) => DAY_FORMAT.test(day) && !Number.isNaN(toMs(day)) && toDay(toMs(day)) === day

export const shiftDay = (day: string, by: number) => toDay(toMs(day) + by * DAY_MS)

/**
 * «Сьогодні» людини приходить із її пристрою, тож сервер приймає лише дату, яка зараз справді може бути десь на Землі:
 * від вчора до завтра за UTC (пояси від −12 до +14 годин). Інакше серію можна було б накрутити датами з минулого чи майбутнього.
 */
export const isPlausibleToday = (day: string, now = new Date()) => {
  if (!isRealDay(day)) return false
  const utc = toDay(now.getTime())
  return day >= shiftDay(utc, -1) && day <= shiftDay(utc, 1)
}

export interface Streak {
  /** Дні поспіль, що закінчуються сьогодні (або вчора, якщо сьогоднішню карту ще не відкрито): серія жива до кінця сьогоднішнього дня */
  current: number
  longest: number
  total: number
  drawnToday: boolean
}

/** Серія за списком днів, коли людина відкривала карту (порядок і повтори не важливі). */
export function streakOf(days: string[], today: string): Streak {
  const set = new Set(days)
  const sorted = [...set].sort()
  let longest = 0
  let run = 0
  let prev = ''
  for (const day of sorted) {
    run = prev && shiftDay(prev, 1) === day ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = day
  }
  const drawnToday = set.has(today)
  let cursor = drawnToday ? today : shiftDay(today, -1)
  let current = 0
  while (set.has(cursor)) {
    current++
    cursor = shiftDay(cursor, -1)
  }
  return { current, longest, total: set.size, drawnToday }
}

/** Останні `count` днів, що закінчуються сьогодні, від старішого до новішого, із позначкою, чи був день із картою. */
export const recentDays = (days: string[], today: string, count = 7) => {
  const set = new Set(days)
  return Array.from({ length: count }, (_, i) => shiftDay(today, i - count + 1)).map((date) => ({ date, drawn: set.has(date) }))
}
