import { test } from 'node:test'
import { deepStrictEqual, strictEqual } from 'node:assert/strict'
import { dbOptions } from './db-config'
import { parseTrustProxy } from './proxy'

const env = (o: Record<string, string>) => (k: string) => o[k]

test('without DATABASE_URL the separate DB_* variables are used, without SSL', () => {
  deepStrictEqual(dbOptions(env({ DB_HOST: 'db', DB_PORT: '5433', DB_USER: 'u', DB_PASS: 'p', DB_NAME: 'n' })), { host: 'db', port: 5433, username: 'u', password: 'p', database: 'n' })
  strictEqual(dbOptions(env({})).host, 'localhost')
  strictEqual(dbOptions(env({})).port, 5432)
})

test('DATABASE_URL is parsed, takes priority, and decodes special characters', () => {
  const o = dbOptions(env({ DATABASE_URL: 'postgres://app%40x:p%2Fw%3Ad@ep-1.neon.tech:6543/mystiq', DB_HOST: 'ignored' }))
  deepStrictEqual(o, { host: 'ep-1.neon.tech', port: 6543, username: 'app@x', password: 'p/w:d', database: 'mystiq' })
})

test('SSL is on for sslmode in the URL or DB_SSL, verified by default, off for sslmode=disable', () => {
  const ssl = (rejectUnauthorized: boolean) => ({ ssl: { require: true, rejectUnauthorized } })
  deepStrictEqual(dbOptions(env({ DATABASE_URL: 'postgres://u:p@h/db?sslmode=require' })).dialectOptions, ssl(true))
  deepStrictEqual(dbOptions(env({ DB_HOST: 'h', DB_SSL: 'true' })).dialectOptions, ssl(true))
  deepStrictEqual(dbOptions(env({ DB_HOST: 'h', DB_SSL: 'no-verify' })).dialectOptions, ssl(false))
  strictEqual(dbOptions(env({ DATABASE_URL: 'postgres://u:p@h/db?sslmode=disable' })).dialectOptions, undefined)
  strictEqual(dbOptions(env({ DATABASE_URL: 'postgres://u:p@h/db' })).dialectOptions, undefined)
})

test('TRUST_PROXY: off by default, a number of proxies, true, or a named range', () => {
  strictEqual(parseTrustProxy(undefined), undefined)
  strictEqual(parseTrustProxy(''), undefined)
  strictEqual(parseTrustProxy('0'), undefined)
  strictEqual(parseTrustProxy('false'), undefined)
  strictEqual(parseTrustProxy('1'), 1)
  strictEqual(parseTrustProxy(' 2 '), 2)
  strictEqual(parseTrustProxy('TRUE'), true)
  strictEqual(parseTrustProxy('loopback'), 'loopback')
})
