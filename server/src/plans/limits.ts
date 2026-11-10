export type Limits = {
  readingsPerMonth: number | null
  dreamsTotal: number | null
  aiMessagesPerDay: number | null
  readingModes: ('quick' | 'detailed' | 'depth')[]
  compatibility: boolean
  forecastRanges: ('day' | 'week' | 'month')[]
  fullReports: boolean
}
const LIMITS: Record<string, Limits> = {
  free: { readingsPerMonth: 5, dreamsTotal: 10, aiMessagesPerDay: 10, readingModes: ['quick'], compatibility: false, forecastRanges: ['day'], fullReports: false },
  pro: { readingsPerMonth: 30, dreamsTotal: 50, aiMessagesPerDay: 25, readingModes: ['quick', 'detailed'], compatibility: true, forecastRanges: ['day', 'week', 'month'], fullReports: true },
  premium: { readingsPerMonth: null, dreamsTotal: null, aiMessagesPerDay: 200, readingModes: ['quick', 'detailed', 'depth'], compatibility: true, forecastRanges: ['day', 'week', 'month'], fullReports: true },
}
// власні ключі таблиці, а не успадковані («constructor», «toString»): Object.hasOwn потребує lib es2022, а ціль збірки — es2021
const known = (plan: string) => Object.prototype.hasOwnProperty.call(LIMITS, plan)
export const limitsOf = (plan: string): Limits => structuredClone(known(plan) ? LIMITS[plan] : LIMITS.free)
export const planOf = (plan: string) => known(plan) ? plan : 'free'
export type Usage = { readingsThisMonth: number; dreamsTotal: number; aiMessagesToday: number }
export const remainingOf = (limits: Limits, usage: Usage) => {
  const left = (max: number | null, used: number) => max === null ? null : Math.max(0, max - used)
  return { readings: left(limits.readingsPerMonth, usage.readingsThisMonth), dreams: left(limits.dreamsTotal, usage.dreamsTotal), aiMessages: left(limits.aiMessagesPerDay, usage.aiMessagesToday) }
}
export function usageWindows(now = new Date()) {
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate()
  return { monthStart: new Date(Date.UTC(y, m, 1)), dayStart: new Date(Date.UTC(y, m, d)), readings: new Date(Date.UTC(y, m + 1, 1)), aiMessages: new Date(Date.UTC(y, m, d + 1)) }
}
