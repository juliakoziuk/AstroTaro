import { Locale, Text } from './locale'

// Повідомлення сервера для людини (помилки та підказки), усіма мовами. {name} — підстановка.
const MESSAGES = {
  emailTaken: { en: 'This email is already registered', uk: 'Цей email уже зареєстровано', es: 'Este correo ya está registrado' },
  badCredentials: { en: 'Invalid email or password', uk: 'Невірний email або пароль', es: 'Correo o contraseña inválidos' },
  notFound: { en: 'Record not found', uk: 'Запис не знайдено', es: 'Registro no encontrado' },
  reportNeedsPro: {
    en: 'The full report is available on the Pro and Premium plans',
    uk: 'Повний звіт доступний на тарифах Pro та Premium',
    es: 'El informe completo está disponible en los planes Pro y Premium',
  },
  reportNeedsBirth: {
    en: 'Please add your date of birth in your profile first',
    uk: 'Спершу вкажіть дату народження в профілі',
    es: 'Primero añade tu fecha de nacimiento en el perfil',
  },
  companionOff: {
    en: 'AI Companion is turned off in Settings',
    uk: 'AI Companion вимкнено в налаштуваннях',
    es: 'El Compañero IA está desactivado en Ajustes',
  },
  badCoords: { en: 'Invalid coordinates', uk: 'Некоректні координати', es: 'Coordenadas no válidas' },
  badCards: {
    en: 'Pick exactly one different card for every position of the spread',
    uk: 'Оберіть рівно по одній різній карті на кожну позицію розкладу',
    es: 'Elige exactamente una carta distinta para cada posición de la tirada',
  },
  upstreamDown: { en: '{name} is temporarily unavailable', uk: '{name} тимчасово недоступний', es: '{name} no está disponible temporalmente' },
  rateLimited: {
    en: '{name}: request limit reached (set your own key in .env)',
    uk: '{name}: вичерпано ліміт запитів (задайте власний ключ у .env)',
    es: '{name}: límite de solicitudes alcanzado (configura tu propia clave en .env)',
  },
  unknown: { en: 'Something went wrong', uk: 'Щось пішло не так', es: 'Algo salió mal' },
} satisfies Record<string, Text>

export type MessageKey = keyof typeof MESSAGES

export const msg = (locale: Locale, key: MessageKey, vars?: Record<string, string>): string =>
  MESSAGES[key][locale].replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? '')

// Помилки валідації (class-validator): ключ обмеження → шаблон. {p} — поле, {0} — перший параметр обмеження.
const VALIDATION: Record<string, Text> = {
  isEmail: { en: '{p} must be a valid email', uk: '{p}: вкажіть коректну адресу пошти', es: '{p} debe ser un correo válido' },
  isString: { en: '{p} must be text', uk: '{p}: потрібен текст', es: '{p} debe ser texto' },
  isNotEmpty: { en: '{p} must not be empty', uk: '{p}: не може бути порожнім', es: '{p} no puede estar vacío' },
  minLength: { en: '{p} must be at least {0} characters', uk: '{p}: щонайменше {0} символів', es: '{p} debe tener al menos {0} caracteres' },
  maxLength: { en: '{p} must be at most {0} characters', uk: '{p}: щонайбільше {0} символів', es: '{p} debe tener como máximo {0} caracteres' },
  isIn: { en: '{p} has an unsupported value', uk: '{p}: недопустиме значення', es: '{p} tiene un valor no admitido' },
  isInt: { en: '{p} must be a whole number', uk: '{p}: потрібне ціле число', es: '{p} debe ser un número entero' },
  isBoolean: { en: '{p} must be true or false', uk: '{p}: потрібне значення так/ні', es: '{p} debe ser verdadero o falso' },
  isDateString: { en: '{p} must be a valid date', uk: '{p}: потрібна коректна дата', es: '{p} debe ser una fecha válida' },
  matches: { en: '{p} has an invalid format', uk: '{p}: неправильний формат', es: '{p} tiene un formato no válido' },
  isUuid: { en: '{p} must be a valid id', uk: '{p}: потрібен коректний id', es: '{p} debe ser un id válido' },
  whitelistValidation: { en: '{p} is not allowed', uk: '{p}: це поле не підтримується', es: '{p} no está permitido' },
}
const VALIDATION_FALLBACK: Text = { en: '{p} is invalid', uk: '{p}: некоректне значення', es: '{p} no es válido' }

export const validationMessage = (locale: Locale, constraint: string, property: string, args: unknown[] = []): string =>
  (VALIDATION[constraint] ?? VALIDATION_FALLBACK)[locale]
    .replace('{p}', property)
    .replace(/\{(\d)\}/g, (_, i) => String(args[Number(i)] ?? ''))
