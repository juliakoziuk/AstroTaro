import { test } from 'node:test'
import { deepStrictEqual, strictEqual } from 'node:assert/strict'
import { Op } from 'sequelize'
import { escapeLike, listConditions } from './list-query'

const BACKSLASH = String.fromCharCode(92)

test('LIKE wildcards in a search are escaped with a backslash', () => {
  strictEqual(escapeLike('100%'), `100${BACKSLASH}%`)
  strictEqual(escapeLike('a_b'), `a${BACKSLASH}_b`)
  strictEqual(escapeLike(`back${BACKSLASH}slash`), `back${BACKSLASH}${BACKSLASH}slash`)
  strictEqual(escapeLike('plain'), 'plain')
})

test('no parameters give no conditions; blank text is ignored', () => {
  deepStrictEqual(listConditions({}, ['text']), [])
  deepStrictEqual(listConditions({ q: '   ' }, ['text']), [])
})

test('text is searched in every given column, case-insensitively', () => {
  const [cond] = listConditions({ q: ' Moon ' }, ['title', 'text']) as { [Op.or]: Record<string, Record<symbol, string>>[] }[]
  const parts = cond[Op.or]
  strictEqual(parts.length, 2)
  strictEqual(parts[0].title[Op.iLike], '%Moon%')
  strictEqual(parts[1].text[Op.iLike], '%Moon%')
})

test('a bare end date covers the whole day, a full date-time is taken as is', () => {
  const [day] = listConditions({ from: '2026-04-01', to: '2026-04-30' }, []) as { date: Record<symbol, Date> }[]
  strictEqual(day.date[Op.gte].toISOString(), '2026-04-01T00:00:00.000Z')
  strictEqual(day.date[Op.lte].toISOString(), '2026-04-30T23:59:59.999Z')
  const [exact] = listConditions({ to: '2026-04-30T10:00:00.000Z' }, []) as { date: Record<symbol, Date> }[]
  strictEqual(exact.date[Op.lte].toISOString(), '2026-04-30T10:00:00.000Z')
})
