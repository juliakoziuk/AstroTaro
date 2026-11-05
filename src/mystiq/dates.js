// «Сьогодні» фіксується при завантаженні сторінки
export const TODAY = new Date()

const DAY = 86400000

export const dayKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
}

export function daysAgoOf(iso) {
  const a = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
  const b = new Date(iso)
  const c = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((a - c) / DAY)
}

export function relativeDay(iso) {
  const n = daysAgoOf(iso)
  if (n <= 0) return 'сьогодні'
  if (n === 1) return 'вчора'
  if (n < 5) return `${n} дні тому`
  return `${n} днів тому`
}

export const fullDate = (iso) => new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })

// Ідентифікатор і час для нових записів (викликаються з обробників подій)
export const newId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`
export const nowIso = () => new Date().toISOString()
