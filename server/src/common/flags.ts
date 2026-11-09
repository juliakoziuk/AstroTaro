/** Перемикач із .env: увімкнений лише явним «true», «1», «yes» або «on»; відсутнє значення означає «вимкнено». */
export const flagOn = (value: unknown): boolean => ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase())
