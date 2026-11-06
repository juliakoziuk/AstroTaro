import { Locale, Text } from './locale'

// Повідомлення сервера для людини (помилки та підказки), усіма мовами. {name} — підстановка.
const MESSAGES = {
  emailTaken: { en: 'This email is already registered', uk: 'Цей email уже зареєстровано',  },
  badCredentials: { en: 'Invalid email or password', uk: 'Невірний email або пароль',  },
  notFound: { en: 'Record not found', uk: 'Запис не знайдено',  },
  reportNeedsPro: {
    en: 'The full report is available on the Pro and Premium plans',
    uk: 'Повний звіт доступний на тарифах Pro та Premium',
  },
  reportNeedsBirth: {
    en: 'Please add your date of birth in your profile first',
    uk: 'Спершу вкажіть дату народження в профілі',
  },
  badPartnerBirth: {
    en: 'Enter a partner date of birth between 1900 and today',
    uk: 'Вкажіть дату народження партнера від 1900 року до сьогодні',
  },
  partnerName: { en: 'Partner', uk: 'Партнер' },
  badDate: { en: 'Enter a valid date (YYYY-MM-DD)', uk: 'Вкажіть коректну дату (РРРР-ММ-ДД)' },
  companionOff: {
    en: 'AI Companion is turned off in Settings',
    uk: 'AI Companion вимкнено в налаштуваннях',
  },
  badCoords: { en: 'Invalid coordinates', uk: 'Некоректні координати',  },
  badCards: {
    en: 'Pick exactly one different card for every position of the spread',
    uk: 'Оберіть рівно по одній різній карті на кожну позицію розкладу',
  },
  upstreamDown: { en: '{name} is temporarily unavailable', uk: '{name} тимчасово недоступний',  },
  rateLimited: {
    en: '{name}: request limit reached (set your own key in .env)',
    uk: '{name}: вичерпано ліміт запитів (задайте власний ключ у .env)',
  },
  unknown: { en: 'Something went wrong', uk: 'Щось пішло не так',  },
} satisfies Record<string, Text>

export type MessageKey = keyof typeof MESSAGES

export const msg = (locale: Locale, key: MessageKey, vars?: Record<string, string>): string =>
  MESSAGES[key][locale].replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? '')

// Помилки валідації (class-validator): ключ обмеження → шаблон. {p} — поле, {0} — перший параметр обмеження.
const VALIDATION: Record<string, Text> = {
  isEmail: { en: '{p} must be a valid email', uk: '{p}: вкажіть коректну адресу пошти',  },
  isString: { en: '{p} must be text', uk: '{p}: потрібен текст',  },
  isNotEmpty: { en: '{p} must not be empty', uk: '{p}: не може бути порожнім',  },
  minLength: { en: '{p} must be at least {0} characters', uk: '{p}: щонайменше {0} символів',  },
  maxLength: { en: '{p} must be at most {0} characters', uk: '{p}: щонайбільше {0} символів',  },
  isIn: { en: '{p} has an unsupported value', uk: '{p}: недопустиме значення',  },
  isInt: { en: '{p} must be a whole number', uk: '{p}: потрібне ціле число',  },
  isBoolean: { en: '{p} must be true or false', uk: '{p}: потрібне значення так/ні',  },
  isDateString: { en: '{p} must be a valid date', uk: '{p}: потрібна коректна дата',  },
  matches: { en: '{p} has an invalid format', uk: '{p}: неправильний формат',  },
  isUuid: { en: '{p} must be a valid id', uk: '{p}: потрібен коректний id',  },
  whitelistValidation: { en: '{p} is not allowed', uk: '{p}: це поле не підтримується',  },
}
const VALIDATION_FALLBACK: Text = { en: '{p} is invalid', uk: '{p}: некоректне значення',  }

export const validationMessage = (locale: Locale, constraint: string, property: string, args: unknown[] = []): string =>
  (VALIDATION[constraint] ?? VALIDATION_FALLBACK)[locale]
    .replace('{p}', property)
    .replace(/\{(\d)\}/g, (_, i) => String(args[Number(i)] ?? ''))
