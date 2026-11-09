import 'reflect-metadata'
import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { configureApp } from '../app.setup'

export interface Reply {
  status: number
  headers: Headers
  body: any
}

export interface Harness {
  app: INestApplication
  /** Запит до справжнього сервера (HTTP, не виклик контролера): метод, шлях без /api, тіло, токен, мова. */
  api(method: string, path: string, opts?: { body?: unknown; token?: string; lang?: string }): Promise<Reply>
  /** Новий користувач із випадковою поштою; повертає токен, id і дані для входу. */
  register(name?: string): Promise<{ token: string; id: string; email: string; password: string }>
  close(): Promise<void>
}

/**
 * Піднімає застосунок на вільному порту з тією самою конфігурацією, що й main.ts. База — та, що в DB_NAME
 * (scripts/e2e.mjs підставляє окрему тестову). Запускати лише через `npm run test:e2e`.
 */
export async function startHarness(): Promise<Harness> {
  if (process.env.NODE_ENV !== 'test') throw new Error('e2e tests must run through `npm run test:e2e` (NODE_ENV=test, separate database)')
  const app = await NestFactory.create(AppModule, { logger: false })
  configureApp(app)
  // ConfigModule щойно прочитав .env у process.env: ключі моделей не потрібні, відповіді мають бути локальними й детермінованими
  for (const k of ['ANTHROPIC_API_KEY', 'LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL']) delete process.env[k]
  await app.listen(0)
  const { port } = app.getHttpServer().address() as { port: number }
  const base = `http://127.0.0.1:${port}/api`

  const api: Harness['api'] = async (method, path, opts = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept-Language': opts.lang ?? 'en', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    })
    const text = await res.text()
    return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null }
  }

  let n = 0
  const register: Harness['register'] = async (name = 'Test') => {
    const email = `e2e-${Date.now()}-${++n}-${Math.random().toString(36).slice(2, 8)}@example.com`
    const password = 'correct horse battery'
    const r = await api('POST', '/auth/register', { body: { name, email, password } })
    if (r.status !== 201) throw new Error(`register failed: ${r.status} ${JSON.stringify(r.body)}`)
    return { token: r.body.token, id: r.body.user.id, email, password }
  }

  return { app, api, register, close: () => app.close() }
}
