// Фото дня. NASA APOD API іноді віддає замість картинки логотип «NASA Science» (для будь-якої дати): це не фото дня.
// Тоді беремо знімок із NASA Image and Video Library, а день визначає, який саме: той самий день — те саме фото.
export interface Apod {
  date: string
  title: string
  explanation: string
  mediaType: string
  url: string
  copyright: string | null
}

export interface LibraryItem {
  data: { title: string; description?: string; nasa_id: string }[]
  links?: { href: string }[]
}

const PLACEHOLDER_TITLE = 'NASA Science'
const PLACEHOLDER_URL = /nasa-logo/i
const HASH_MULTIPLIER = 31

export const LIBRARY_SEARCH_URL = 'https://images-api.nasa.gov/search?q=nebula%20galaxy&media_type=image&page_size=100'

/** Справжнє фото дня має адресу картинки й не є логотипом-заглушкою. */
export const isRealApod = ({ title, url }: { title?: string; url?: string }): boolean =>
  !!url && !PLACEHOLDER_URL.test(url) && title !== PLACEHOLDER_TITLE

/** Стабільний індекс 0…count−1 за рядком дати. */
export function dailyIndex(date: string, count: number): number {
  let hash = 0
  for (const ch of date) hash = (hash * HASH_MULTIPLIER + ch.charCodeAt(0)) >>> 0
  return hash % count
}

const plainText = (html = '') => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

/** Знімок бібліотеки NASA у вигляді відповіді /cosmos/apod. */
export function apodFromLibrary(item: LibraryItem, date: string): Apod {
  const [{ title, description }] = item.data
  return { date, title, explanation: plainText(description), mediaType: 'image', url: item.links?.[0]?.href ?? '', copyright: null }
}
