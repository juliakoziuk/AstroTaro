import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { ProfileController } from './profile'
import { CompanionController } from '../companion/companion'
import { TarotController } from '../tarot/tarot'
import { DEFAULT_SETTINGS } from '../users/settings'

test('export contains only the current user records and excludes authentication secrets', async () => {
  const queried: string[] = []
  const user = { name: 'X', email: 'x@example.test', passwordHash: 'must-not-export', settings: {}, consent: { dreams: true } }
  const users = { findByPk: async (id: string) => { strictEqual(id, 'owner'); return user } }
  const records = { findAll: async ({ where }: any) => { queried.push(where.userId); return [{ title: 'private record' }] } }
  const controller = new ProfileController(users as any, records as any, records as any, records as any, records as any, records as any)
  const result = await controller.exportData({ id: 'owner' })
  deepStrictEqual(queried, Array(5).fill('owner'))
  ok(!JSON.stringify(result).includes('must-not-export'))
  strictEqual(result.profile.email, user.email)
  strictEqual(result.messages.length, 1)
})

test('reset restores preferences while keeping records and AI consent', async () => {
  let saves = 0
  const consent = { dreams: true, journal: false, spreads: true }
  const user = { settings: { ...DEFAULT_SETTINGS, theme: 'Light', autosave: false }, consent, save: async () => { saves++ } }
  const controller = new ProfileController({ findByPk: async () => user } as any, null, null, null, null, null)
  const result = await controller.resetSettings({ id: 'owner' })
  deepStrictEqual(result, DEFAULT_SETTINGS)
  strictEqual(user.consent, consent)
  strictEqual(saves, 1)
})

test('the companion never queries private records without the corresponding consent', async () => {
  const denied = { findAll: async () => { throw new Error('queried without consent') }, findOne: async () => { throw new Error('queried without consent') } }
  const controller = new CompanionController(null, null, denied as any, denied as any, denied as any, null) // останній параметр: облік використання тарифу, у loadContext не потрібен
  const context = await (controller as any).loadContext({ id: 'owner', name: 'X', consent: { dreams: false, journal: false, spreads: false } }, new Date('2026-11-05'))
  deepStrictEqual(context.dreams, [])
  deepStrictEqual(context.moods, [])
  strictEqual(context.lastReading, null)
})

test('with autosave off a tarot reading is presented without writing to the database', async () => {
  let writes = 0
  const spreads = {
    create: async () => { writes++; throw new Error('unexpected database write') },
    build: (values: any) => {
      const record = { ...values, id: 'temporary', date: new Date(), narratives: { en: 'Preview interpretation' }, saved: false }
      return { ...record, toJSON: () => record, save: async () => { writes++; throw new Error('unexpected save') } }
    },
  }
  const users = { findByPk: async () => ({ settings: { ...DEFAULT_SETTINGS, autosave: false } }) }
  const usage = { accept: async () => undefined } // облік використання тарифу: тут перевіряємо лише, що в базу нічого не пишеться
  const controller = new TarotController(spreads as any, users as any, usage as any)
  const result = await controller.create({ id: 'owner' }, { spreadId: 'daily', deck: 'Classic Tarot', mode: 'quick', cards: [{ id: 19, reversed: false }] })
  strictEqual(result.temporary, true)
  strictEqual(writes, 0)
  ok(result.result)
})
