// Карти людською мовою: що відбувається (прямо й перевернуто), як це може виглядати в житті і що з цим робити.
// Дані лежать у plain-*.ts (по масті), тут — доступ за id карти й мовою. Старий cards.ts лишається довідником назв.
import { Locale, LOCALES } from '../i18n/locale'
import { MAJOR_PLAIN } from './plain-major'
import { CUPS_PLAIN, WANDS_PLAIN } from './plain-minor-a'
import { PENTACLES_PLAIN, SWORDS_PLAIN } from './plain-minor-b'

export interface PlainCard {
  up: string // що відбувається, коли карта пряма (іменникова група)
  rev: string // те саме в перевернутому положенні
  scene: string // як це може виглядати в житті (приклади)
  tip: string // що з цим робити (наказовий спосіб)
}

// порядок як у колоді cards.ts: 22 старші, потім Жезли, Кубки, Мечі, Пентаклі
export const ALL_PLAIN: string[][] = [...MAJOR_PLAIN, ...WANDS_PLAIN, ...CUPS_PLAIN, ...SWORDS_PLAIN, ...PENTACLES_PLAIN]

export function plainOf(id: number, locale: Locale): PlainCard {
  const row = ALL_PLAIN[id]
  const l = LOCALES.indexOf(locale)
  return { up: row[l], rev: row[2 + l], scene: row[4 + l], tip: row[6 + l] }
}
