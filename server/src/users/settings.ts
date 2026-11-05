// Налаштування користувача: одне місце для допустимих значень і значень за замовчуванням.
export const SETTING_OPTIONS = {
  language: ['English', 'Ukrainian', 'Spanish'],
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
