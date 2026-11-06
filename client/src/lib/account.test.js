import { test } from 'node:test'
import { deepStrictEqual } from 'node:assert/strict'
import { accountOf } from './account.js'

test('the account shows the name and the initials of the first two words', () => {
  deepStrictEqual(accountOf({ name: 'Юлія Козюк', email: 'j@x.co' }), { name: 'Юлія Козюк', initials: 'ЮК' })
  deepStrictEqual(accountOf({ name: '  юля  ', email: 'j@x.co' }), { name: 'юля', initials: 'Ю' })
  deepStrictEqual(accountOf({ name: 'Anna Maria Lee', email: 'a@x.co' }), { name: 'Anna Maria Lee', initials: 'AM' })
})

test('without a name the account falls back to the email', () => {
  deepStrictEqual(accountOf({ name: '  ', email: 'julia@x.co' }), { name: 'julia@x.co', initials: 'J' })
})
