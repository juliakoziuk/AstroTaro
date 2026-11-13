// Міграції бази: node --env-file=.env scripts/migrate.mjs [--status] [--create]  (npm run migrate / npm run migrate:status)
// Виконує файли migrations/*.sql за іменем, кожен у своїй транзакції, і записує виконані в таблицю schema_migrations.
// Уже виконаний файл не повторюється й не повинен змінюватися: зміну схеми додавайте новим файлом (0003_….sql).
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')
const statusOnly = process.argv.includes('--status')

// Підключення: DATABASE_URL (Neon, Render…) або DB_HOST/…; SSL за sslmode в адресі чи DB_SSL=true|no-verify.
// Та сама логіка, що в src/common/db-config.ts (тут це звичайний JS без збірки, тож вона повторена).
const url = process.env.DATABASE_URL?.trim() ? new URL(process.env.DATABASE_URL.trim()) : null
const sslFlag = (process.env.DB_SSL ?? '').trim().toLowerCase()
const urlMode = (url?.searchParams.get('sslmode') ?? '').toLowerCase()
const noVerify = sslFlag === 'no-verify' || urlMode === 'no-verify'
const useSsl = noVerify || ['1', 'true', 'yes', 'on'].includes(sslFlag) || (urlMode !== '' && urlMode !== 'disable')
const databaseName = url ? decodeURIComponent(url.pathname.replace(/^\//, '')) : process.env.DB_NAME

const connection = (database) => ({
  host: url ? url.hostname : (process.env.DB_HOST ?? 'localhost'),
  port: url ? Number(url.port || 5432) : Number(process.env.DB_PORT ?? 5432),
  user: url ? decodeURIComponent(url.username) : process.env.DB_USER,
  password: url ? decodeURIComponent(url.password) : process.env.DB_PASS,
  database,
  connectionTimeoutMillis: 20_000, // не ждати з'єднання вічно: краще впасти з помилкою, ніж мовчки завісити деплой
  ...(useSsl ? { ssl: { rejectUnauthorized: !noVerify } } : {}),
})

// --create: спершу створити саму базу, якщо її ще немає (для тестової бази й чистого встановлення)
if (process.argv.includes('--create') && url) {
  console.log('  --create is skipped with DATABASE_URL: the managed database already exists')
} else if (process.argv.includes('--create')) {
  const admin = new pg.Client(connection('postgres'))
  await admin.connect()
  try {
    const name = databaseName
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (!exists.rowCount) {
      await admin.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`)
      console.log(`  created database ${name}`)
    }
  } finally {
    await admin.end()
  }
}

const client = new pg.Client(connection(databaseName))
await client.connect()

// Один виконавець за раз: дві репліки чи два деплої одночасно не застосують файл двічі.
// Блокування тримаємо лише на час транзакції (pg_advisory_xact_lock): воно зникає саме при COMMIT/ROLLBACK. Колишнє сесійне
// pg_advisory_lock через пулер Neon (PgBouncer) могло лишатись на чужому з'єднанні й вічно блокувати наступні запуски (деплой висів
// після «node scripts/migrate.mjs» без жодного рядка). Ключ тепер інший, щоб не наткнутись на таке застрягле блокування зі старої версії.
// lock_timeout: чекати на іншого виконавця не довше хвилини, далі помилка замість вічного очікування.
const LOCK_KEY = 727275
async function inLock(work) {
  await client.query('BEGIN')
  try {
    await client.query("SET LOCAL lock_timeout = '60s'")
    await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEY])
    const result = await work()
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  }
}

try {
  await inLock(() => client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'))
  const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name))
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
  let applied = 0
  for (const file of files) {
    if (done.has(file)) {
      console.log(`  ok       ${file}`)
      continue
    }
    if (statusOnly) {
      console.log(`  PENDING  ${file}`)
      continue
    }
    const sql = await readFile(path.join(dir, file), 'utf8')
    let outcome
    try {
      // у блокуванні перевіряємо ще раз: інший запуск міг застосувати цей файл, поки ми чекали
      outcome = await inLock(async () => {
        if ((await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file])).rowCount) return 'already'
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
        return 'applied'
      })
    } catch (e) {
      console.error(`FAILED   ${file}: ${e.message}`)
      process.exitCode = 1
      break
    }
    if (outcome === 'already') {
      console.log(`  ok       ${file}`)
      continue
    }
    console.log(`  applied  ${file}`)
    applied++
  }
  if (!statusOnly && !process.exitCode) console.log(applied ? `Done: ${applied} applied.` : 'Nothing to apply: the database is up to date.')
} finally {
  await client.end()
}
