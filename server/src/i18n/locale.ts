import { AsyncLocalStorage } from 'node:async_hooks'

// Мова відповіді. Клієнт шле її в заголовку Accept-Language; middleware кладе в контекст запиту, і будь-який код
// усередині запиту читає currentLocale(). Дані в базі зберігаються нейтрально (id карт, символів тощо) і
// перекладаються на краю: у відповіді API.
export const LOCALES = ['en', 'uk', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** Текст у всіх мовах. */
export type Text = Record<Locale, string>

/** Назва мови англійською: для підказки AI («Answer in Ukrainian»). */
export const LANGUAGE_NAME: Record<Locale, string> = { en: 'English', uk: 'Ukrainian', es: 'Spanish' }

const SETTING: Record<string, Locale> = { English: 'en', Ukrainian: 'uk', Spanish: 'es' }
export const localeFromSetting = (name?: string): Locale => SETTING[name ?? ''] ?? DEFAULT_LOCALE

/** Перша підтримувана мова із заголовка Accept-Language (враховує порядок, а не ваги: цього досить). */
export function parseLocale(header?: string | string[]): Locale {
  const text = Array.isArray(header) ? header.join(',') : (header ?? '')
  for (const part of text.split(',')) {
    const code = part.trim().slice(0, 2).toLowerCase()
    const hit = LOCALES.find((l) => l === code)
    if (hit) return hit
  }
  return DEFAULT_LOCALE
}

const store = new AsyncLocalStorage<Locale>()
export const runWithLocale = <T>(locale: Locale, fn: () => T): T => store.run(locale, fn)
export const currentLocale = (): Locale => store.getStore() ?? DEFAULT_LOCALE
