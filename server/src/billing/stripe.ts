import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Stripe без офіційного SDK: потрібні лише два виклики REST API (форма application/x-www-form-urlencoded) і перевірка підпису
 * вебхука. Базова адреса береться з STRIPE_API_BASE (у тестах це локальний підроблений сервер), за замовчуванням https://api.stripe.com.
 */

type Param = string | number | boolean | undefined | null | { [key: string]: Param } | Param[]

/** Вкладені об'єкти й масиви у формат Stripe: { a: { b: 1 }, c: [x] } → a[b]=1&c[0]=x. Порожні значення пропускаємо. */
export function encodeForm(params: Record<string, Param>): string {
  const pairs: [string, string][] = []
  const walk = (key: string, value: Param) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) value.forEach((v, i) => walk(`${key}[${i}]`, v))
    else if (typeof value === 'object') Object.entries(value).forEach(([k, v]) => walk(`${key}[${k}]`, v))
    else pairs.push([key, String(value)])
  }
  Object.entries(params).forEach(([k, v]) => walk(k, v))
  return pairs.map(([k, v]) => `${encodeURIComponent(k).replace(/%5B/g, '[').replace(/%5D/g, ']')}=${encodeURIComponent(v)}`).join('&')
}

/**
 * Мови, які приймає параметр locale сесії Checkout (довідка Stripe). Української там немає: надіслати «uk» означає отримати 400
 * «Invalid locale» і не потрапити на оплату, тож для решти мов просимо «auto» (Stripe сам обере мову з браузера).
 */
export const STRIPE_LOCALES = ['auto', 'bg', 'cs', 'da', 'de', 'el', 'en', 'en-GB', 'es', 'es-419', 'et', 'fi', 'fil', 'fr', 'fr-CA', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'ms', 'mt', 'nb', 'nl', 'pl', 'pt', 'pt-BR', 'ro', 'ru', 'sk', 'sl', 'sv', 'th', 'tr', 'vi', 'zh', 'zh-HK', 'zh-TW']
export const stripeLocale = (appLocale: string) => (STRIPE_LOCALES.includes(appLocale) ? appLocale : 'auto')

export const SIGNATURE_TOLERANCE_SECONDS = 300

/**
 * Перевірка заголовка Stripe-Signature (`t=<час>,v1=<підпис>[,v1=…]`): HMAC-SHA256 від «час.сире_тіло» ключем whsec_…
 * Підпис мусить збігатися (порівняння за сталий час), а час — бути не старішим за 5 хвилин: це не дає повторити перехоплений запит.
 * Тіло має бути саме тим, що надіслав Stripe, байт у байт, тому береться сире, а не розібране JSON.
 */
export function verifyStripeSignature(rawBody: Buffer | string, header: string | undefined, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false
  const parts = header.split(',').map((p) => p.trim().split('=') as [string, string])
  const timestamp = parts.find(([k]) => k === 't')?.[1]
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!timestamp || !/^\d+$/.test(timestamp) || !signatures.length) return false
  if (Math.abs(nowSeconds - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) return false
  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest()
  return signatures.some((sig) => {
    const given = Buffer.from(sig, 'hex')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}

/** Підпис для тестів і локальних перевірок: те, що зробив би Stripe. */
export const signStripePayload = (rawBody: string, secret: string, timestamp = Math.floor(Date.now() / 1000)) =>
  `t=${timestamp},v1=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`

export class StripeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export interface StripeConfig {
  secretKey?: string
  webhookSecret?: string
  prices: { pro?: string; premium?: string }
  apiBase: string
}

export const stripeConfig = (env: NodeJS.ProcessEnv = process.env): StripeConfig => ({
  secretKey: env.STRIPE_SECRET_KEY || undefined,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || undefined,
  prices: { pro: env.STRIPE_PRICE_PRO || undefined, premium: env.STRIPE_PRICE_PREMIUM || undefined },
  apiBase: (env.STRIPE_API_BASE || 'https://api.stripe.com').replace(/\/$/, ''),
})

/** Один POST до Stripe API; повертає розібрану відповідь або кидає StripeError з повідомленням Stripe. */
export async function stripePost<T = any>(config: StripeConfig, path: string, params: Record<string, Param>, fetchFn: typeof fetch = fetch): Promise<T> {
  if (!config.secretKey) throw new StripeError('Stripe is not configured', 503)
  const res = await fetchFn(`${config.apiBase}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodeForm(params),
    signal: AbortSignal.timeout(15_000),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new StripeError(data?.error?.message ?? `Stripe answered ${res.status}`, res.status)
  return data as T
}
