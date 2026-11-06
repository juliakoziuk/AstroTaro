// Налаштування користувача: одне місце для допустимих значень і значень за замовчуванням.
export const SETTING_OPTIONS = {
  language: ['English', 'Ukrainian'],
  theme: ['Dark', 'Light', 'Auto'],
  defaultReading: ['Astrology', 'Tarot', 'Dreams'],
  timeFormat: ['24-hour', '12-hour'],
  dateFormat: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
} as const

export interface Settings {
  notifications: boolean
  insights: boolean
  autosave: boolean
  companion: boolean
  language: string
  theme: string
  defaultReading: string
  timeFormat: string
  dateFormat: string
}

export const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  insights: true,
  autosave: true,
  companion: true,
  language: 'English',
  theme: 'Dark',
  defaultReading: 'Tarot',
  timeFormat: '24-hour',
  dateFormat: 'DD/MM/YYYY',
}

/**
 * Збережені налаштування, доповнені значеннями за замовчуванням. Мова, якої вже немає в SETTING_OPTIONS (наприклад,
 * видалена іспанська), замінюється мовою за замовчуванням, щоб у інтерфейсі завжди була вибрана одна з доступних.
 */
export function withDefaults(stored?: Partial<Settings> | null): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...stored }
  const known = (SETTING_OPTIONS.language as readonly string[]).includes(merged.language)
  return known ? merged : { ...merged, language: DEFAULT_SETTINGS.language }
}
