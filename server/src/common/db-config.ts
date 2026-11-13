import { flagOn } from './flags'

type Get = (key: string) => string | undefined

export interface DbOptions {
  host: string
  port: number
  username?: string
  password?: string
  database?: string
  /** Захищене з'єднання: потрібне керованим базам (Neon, Supabase, Render); локальний Postgres зазвичай без нього. */
  dialectOptions?: { ssl: { require: true; rejectUnauthorized: boolean } }
}

/**
 * Підключення до PostgreSQL із середовища. Два способи:
 *   DATABASE_URL=postgres://користувач:пароль@хост:5432/база?sslmode=require   (так її дають Neon, Render, Supabase)
 *   DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME                                  (локально)
 * DATABASE_URL має перевагу. SSL вмикається, якщо в адресі є sslmode (крім disable) або DB_SSL=true; DB_SSL=no-verify
 * вмикає шифрування без перевірки сертифіката (для баз із самопідписаним сертифікатом). Те саме робить scripts/migrate.mjs.
 */
export function dbOptions(get: Get): DbOptions {
  const raw = get('DATABASE_URL')?.trim()
  let base: Omit<DbOptions, 'dialectOptions'>
  let urlMode = ''
  if (raw) {
    const u = new URL(raw)
    base = {
      host: u.hostname,
      port: Number(u.port || 5432),
      username: decodeURIComponent(u.username) || undefined,
      password: decodeURIComponent(u.password) || undefined,
      database: decodeURIComponent(u.pathname.replace(/^\//, '')) || undefined,
    }
    urlMode = (u.searchParams.get('sslmode') ?? '').toLowerCase()
  } else {
    base = { host: get('DB_HOST') || 'localhost', port: Number(get('DB_PORT') || 5432), username: get('DB_USER'), password: get('DB_PASS'), database: get('DB_NAME') }
  }
  const flag = (get('DB_SSL') ?? '').trim().toLowerCase()
  const noVerify = flag === 'no-verify' || urlMode === 'no-verify'
  const on = noVerify || flagOn(flag) || (urlMode !== '' && urlMode !== 'disable')
  return on ? { ...base, dialectOptions: { ssl: { require: true, rejectUnauthorized: !noVerify } } } : base
}
