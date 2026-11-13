import 'reflect-metadata'
import { test } from 'node:test'
import { deepStrictEqual, strictEqual } from 'node:assert/strict'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { DrawDto } from './tarot'

const check = async (body: object) => {
  const dto = plainToInstance(DrawDto, body)
  return { dto, errors: (await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).map((e) => e.property) }
}

test('a reading request without a deck is valid and gets the only deck (the client no longer sends one)', async () => {
  const { dto, errors } = await check({ spreadId: 'three', mode: 'quick', cards: [{ id: 1, reversed: false }, { id: 2, reversed: true }, { id: 3, reversed: false }] })
  deepStrictEqual(errors, [])
  strictEqual(dto.deck, 'Classic Tarot')
})

test('a known deck is still accepted and an unknown one is still refused', async () => {
  deepStrictEqual((await check({ spreadId: 'three', deck: 'Thoth' })).errors, [])
  deepStrictEqual((await check({ spreadId: 'three', deck: 'Home-made' })).errors, ['deck'])
})
