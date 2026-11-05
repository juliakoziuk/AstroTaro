import tzlookup from 'tz-lookup'

/** IANA-зона за координатами (офлайн, база tz-lookup). */
export const zoneAt = (lat: number, lon: number) => tzlookup(lat, lon)

/** Зсув зони від UTC (хвилини) у вказаний момент; враховує історичний літній час (ICU). */
function offsetMinutes(zone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(utcMs))
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000)
}

/**
 * Місцевий час народження → момент у UTC. Зсув залежить від самого моменту (літній час), тож уточнюємо двічі:
 * спершу беремо зсув за «наївним» часом, потім за результатом.
 */
export function localToUtc(date: string, time: string, zone: string): Date {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const naive = Date.UTC(y, mo - 1, d, h, mi)
  let utc = naive - offsetMinutes(zone, naive) * 60000
  utc = naive - offsetMinutes(zone, utc) * 60000
  return new Date(utc)
}
