// Наскрізні тести HTTP-шару: npm run test:e2e
// Працюють з окремою базою (E2E_DB_NAME, за замовчуванням AstroTarot_test), тож робочі дані не зачіпають: скрипт створює її
// й накочує міграції, потім запускає dist/e2e/*.e2e.js. Потрібен запущений PostgreSQL (docker compose up -d) і зібраний dist.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env')) // у CI .env немає: змінні задає job

const dbName = process.env.E2E_DB_NAME ?? 'AstroTarot_test'
if (dbName === process.env.DB_NAME && !process.env.E2E_DB_NAME) {
  // захист від випадку, коли робоча база сама називається AstroTarot_test
  console.error(`E2E_DB_NAME is not set and DB_NAME is already ${dbName}: set E2E_DB_NAME explicitly`)
  process.exit(1)
}
// прапорці з локального .env не мають впливати на результат: тести перевіряють поведінку «як у продакшені»
const env = { ...process.env, DB_NAME: dbName, DB_SYNC: 'false', ALLOW_DEMO_BILLING: 'false', NODE_ENV: 'test' }
// ключі моделей із .env не потрібні: відповіді в тестах мають бути локальними, детермінованими й безкоштовними
for (const k of ['ANTHROPIC_API_KEY', 'LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL']) delete env[k]

const run = (args) => spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' })
let r = run(['scripts/migrate.mjs', '--create'])
if (r.status) process.exit(r.status)
r = run(['--test', '--test-concurrency=1', 'dist/e2e/api.e2e.js'])
process.exit(r.status ?? 1)
