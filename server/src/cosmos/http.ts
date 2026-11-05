// Спільне для зовнішніх API: запит JSON з таймаутом і ідентифікацією, кеш із терміном дії, пауза між запитами.
export const USER_AGENT = process.env.APP_USER_AGENT ?? 'AstroTarot/0.1 (local development)'

export class TtlCache<T> {
  private items = new Map<string, { value: T; until: number }>()

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const hit = this.items.get(key)
    if (!hit) return undefined
    if (hit.until < Date.now()) {
      this.items.delete(key)
      return undefined
    }
    return hit.value
  }

  set(key: string, value: T) {
    this.items.set(key, { value, until: Date.now() + this.ttlMs })
  }
}

/** Запит JSON: помилка або таймаут → Error (контролер перетворює на 502). Збій 5xx повторюємо один раз. */
export async function fetchJson<T>(url: string, timeoutMs = 9000): Promise<T> {
  const attempt = () => fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) })
  let res = await attempt()
  if (res.status >= 500) {
    await new Promise((r) => setTimeout(r, 600))
    res = await attempt()
  }
  if (!res.ok) throw new Error(`${new URL(url).host} відповів ${res.status}`)
  return (await res.json()) as T
}

/** Кеш + запит: однакові запити до зовнішнього API не повторюємо, поки не мине ttl. */
export async function cached<T>(cache: TtlCache<T>, key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const value = await load()
  cache.set(key, value)
  return value
}

/** Не частіше одного виклику на `gapMs` (політика Nominatim: ≤ 1 запит на секунду). */
export function throttled(gapMs: number) {
  let last = Promise.resolve()
  return <T>(fn: () => Promise<T>): Promise<T> => {
    const run = last.then(fn)
    last = run.then(
      () => new Promise<void>((r) => setTimeout(r, gapMs)),
      () => new Promise<void>((r) => setTimeout(r, gapMs)),
    )
    return run
  }
}
