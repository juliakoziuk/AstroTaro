export interface Holiday {
  date: string // YYYY-MM-DD
  localName: string
  name?: string
}

/** Найближчі n свят, починаючи з today (включно), за зростанням дати. */
export const upcomingHolidays = (all: Holiday[], today: string, n: number): Holiday[] =>
  all
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, n)
