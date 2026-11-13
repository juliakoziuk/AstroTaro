/**
 * TRUST_PROXY для Express: скільки проксі стоїть перед сервером (1 для Render, Railway тощо), «true» — довіряти всім або
 * назва/адреса підмережі («loopback»). Без значення (і «false», «0») проксі не довіряємо: так локально, без проксі.
 * Від цього залежить req.ip, а на ньому тримаються ліміти входу й реєстрації: за проксі без налаштування всі користувачі
 * мали б одну адресу й спільні ліміти.
 */
export function parseTrustProxy(value: string | undefined): number | boolean | string | undefined {
  const v = (value ?? '').trim()
  if (!v || v === '0' || v.toLowerCase() === 'false') return undefined
  if (v.toLowerCase() === 'true') return true
  if (/^\d+$/.test(v)) return Number(v)
  return v
}
