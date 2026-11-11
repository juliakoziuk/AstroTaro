// Дати й час за налаштуваннями користувача (Date format: DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD; Time format: 24-hour | 12-hour).
const pad = (n) => String(n).padStart(2, '0')

export function formatDate(value, fmt = 'DD/MM/YYYY') {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const [dd, mm, yyyy] = [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()]
  if (fmt === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`
  if (fmt === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`
  return `${dd}/${mm}/${yyyy}`
}

export function formatTime(value, fmt = '24-hour', timeZone) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  if (timeZone) {
    // час у зоні потрібної точки (напр. схід сонця у місті народження), а не в зоні браузера
    return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: fmt === '12-hour' }).format(d)
  }
  if (fmt === '12-hour') return `${d.getHours() % 12 || 12}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Дату-рядок без часу (YYYY-MM-DD) форматуємо без зсуву часових поясів. */
export const formatDay = (ymd, fmt) => (ymd ? formatDate(`${ymd}T12:00:00`, fmt) : '')

export function greeting(now = new Date()) {
  const h = now.getHours()
  if (h < 5) return 'Good night,'
  if (h < 12) return 'Good morning,'
  if (h < 18) return 'Good afternoon,'
  return 'Good evening,'
}

/** Перші ~max символів тексту для прев’ю в списках. */
export const snippet = (text, max = 38) => {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

const MS_PER_MINUTE = 60 * 1000
/** «Сьогодні» за місцевим годинником людини (РРРР-ММ-ДД), а не за UTC: від цієї дати сервер рахує день карти й прогнозу. */
export const localDay = (now = new Date()) => new Date(now.getTime() - now.getTimezoneOffset() * MS_PER_MINUTE).toISOString().slice(0, 10)
