// Кеш перевірки токена: JwtStrategy на кожен запит питав базу лише про passwordChangedAt. Один екран робить 5–10 запитів,
// тож це 5–10 зайвих походів у базу (на Neon після простою — ще й пробудження). Тримаємо значення в пам'яті процесу.
// Єдиний спосіб зробити токени недійсними — змінити пароль (passwordChangedAt): його скидання викликає forgetSession,
// тож закриття сеансів лишається миттєвим. Користувачів не видаляють; відсутнього в кеш не кладемо.
const TTL_MS = 60_000
const MAX_ENTRIES = 5_000

const cache = new Map<string, { changed: number; expires: number }>()

/** Секунди зміни пароля (0 — не змінювали), якщо відомі й свіжі; інакше undefined. */
export function cachedPasswordChange(userId: string): number | undefined {
  const hit = cache.get(userId)
  if (!hit) return undefined
  if (hit.expires < Date.now()) {
    cache.delete(userId)
    return undefined
  }
  return hit.changed
}

export function rememberPasswordChange(userId: string, changed: number) {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string) // найстаріший запис
  cache.set(userId, { changed, expires: Date.now() + TTL_MS })
}

/** Пароль змінено (або інакше треба перечитати користувача): наступний запит піде в базу. */
export function forgetSession(userId: string) {
  cache.delete(userId)
}
