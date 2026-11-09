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
  tooManyAttempts: {
    en: 'Too many attempts. Try again in {minutes} min.',
    uk: 'Забагато спроб. Спробуйте ще раз за {minutes} хв.',
  },
  paymentUnavailable: {
    en: 'Paid plans cannot be activated yet: online payment is not connected',
    uk: 'Платні тарифи поки недоступні: онлайн-оплату ще не підключено',
  },
  badToken: {
    en: 'This link is invalid or has expired. Request a new one.',
    uk: 'Посилання недійсне або прострочене. Запросіть нове.',
  },
  alreadyVerified: { en: 'This email is already confirmed', uk: 'Пошту вже підтверджено' },
  resetMailSubject: { en: 'Reset your MYSTIQ password', uk: 'Скидання пароля MYSTIQ' },
  resetMailBody: {
    en: 'Hello, {name}!\n\nSomeone asked to reset the password of your MYSTIQ account. To choose a new one, open this link within one hour:\n\n{link}\n\nIf it was not you, ignore this email: your password stays as it is.',
    uk: 'Вітаємо, {name}!\n\nХтось попросив скинути пароль вашого акаунта MYSTIQ. Щоб обрати новий, відкрийте це посилання протягом години:\n\n{link}\n\nЯкщо це були не ви, просто проігноруйте лист: пароль лишиться як був.',
  },
  verifyMailSubject: { en: 'Confirm your email for MYSTIQ', uk: 'Підтвердіть пошту для MYSTIQ' },
  verifyMailBody: {
    en: 'Welcome, {name}!\n\nConfirm that this is your email by opening the link (valid for 3 days):\n\n{link}',
    uk: 'Вітаємо, {name}!\n\nПідтвердіть, що ця пошта ваша, відкривши посилання (діє 3 дні):\n\n{link}',
  },
  billingAlreadySubscribed: {
    en: 'You already have a subscription. Change or cancel it in the billing portal.',
    uk: 'Підписка вже оформлена. Змінити чи скасувати її можна в порталі оплати.',
  },
  billingManageInPortal: {
    en: 'The plan of an active subscription is changed in the billing portal',
    uk: 'Тариф активної підписки змінюється в порталі оплати',
  },
  billingNoCustomer: { en: 'There is no subscription to manage yet', uk: 'Підписки для керування ще немає' },
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
  maxBytes: { en: '{p} must be at most {0} bytes (non-Latin letters take 2 bytes each)', uk: '{p}: щонайбільше {0} байтів (кирилиця займає по 2 байти на літеру)',  },
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
