// Міграції бази: node --env-file=.env scripts/migrate.mjs [--status] [--create]  (npm run migrate / npm run migrate:status)
// Виконує файли migrations/*.sql за іменем, кожен у своїй транзакції, і записує виконані в таблицю schema_migrations.
// Уже виконаний файл не повторюється й не повинен змінюватися: зміну схеми додавайте новим файлом (0003_….sql).
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')
const statusOnly = process.argv.includes('--status')

const connection = (database) => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database,
})

// --create: спершу створити саму базу, якщо її ще немає (для тестової бази й чистого встановлення)
if (process.argv.includes('--create')) {
  const admin = new pg.Client(connection('postgres'))
  await admin.connect()
  try {
    const name = process.env.DB_NAME
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (!exists.rowCount) {
      await admin.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`)
      console.log(`  created database ${name}`)
    }
  } finally {
    await admin.end()
  }
}

const client = new pg.Client(connection(process.env.DB_NAME))
await client.connect()
try {
  // один виконавець за раз: два одночасні запуски (наприклад, дві репліки) не застосують файл двічі
  await client.query('SELECT pg_advisory_lock(727274)')
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
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
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      console.error(`FAILED   ${file}: ${e.message}`)
      process.exitCode = 1
      break
    }
    console.log(`  applied  ${file}`)
    applied++
  }
  if (!statusOnly && !process.exitCode) console.log(applied ? `Done: ${applied} applied.` : 'Nothing to apply: the database is up to date.')
} finally {
  await client.end()
}
