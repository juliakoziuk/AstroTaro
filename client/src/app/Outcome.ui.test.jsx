import { describe, expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import History from './History.jsx'
import { mockApi } from '../test/setup.js'

const SPREADS = [{ id: 'three', name: 'Three cards', positions: ['Past', 'Present', 'Future'] }]
const CARDS = Array.from({ length: 78 }, (_, i) => ({ id: i, name: `Card ${i}` }))
const cards = [{ id: 0, reversed: false }, { id: 1, reversed: true }, { id: 2, reversed: false }]
const row = (id, extra) => ({
  id, date: '2026-03-10T10:00:00.000Z', spreadId: 'three', saved: false, shareToken: null, question: `Question ${id}`, cards,
  result: { summary: `Summary ${id}`, positions: [] }, outcome: null, outcomeDue: false, ...extra,
})
const STATS = { total: 3, answered: 0, yes: 0, partly: 0, no: 0, waiting: 2, rate: null, topCards: [] }
const base = (rows, stats = STATS, extra = {}) => ({
  'GET /spreads': [200, rows],
  'GET /tarot/spreads': [200, SPREADS],
  'GET /tarot/cards': [200, CARDS],
  'GET /settings': [200, { dateFormat: 'DD/MM/YYYY', timeFormat: '24-hour' }],
  'GET /spreads/accuracy': [200, stats],
  ...extra,
})
const entry = (q) => screen.getByText(`“${q}”`).closest('li')

describe('"did it come true?" in the history', () => {
  test('only readings that are due get the question; a fresh one does not', async () => {
    mockApi(base([row('a', { outcomeDue: true }), row('b')]))
    render(<History />)
    await screen.findByText('“Question a”')
    expect(within(entry('Question a')).getByText('Did it come true?')).toBeTruthy()
    expect(within(entry('Question b')).queryByText('Did it come true?')).toBeNull()
  })

  test('answering saves it, shows the mark and refreshes the summary', async () => {
    let stats = STATS
    const calls = mockApi(
      base([row('a', { outcomeDue: true })], STATS, {
        'GET /spreads/accuracy': () => [200, stats],
        'PUT /spreads/a/outcome': () => {
          stats = { ...STATS, answered: 1, yes: 1, waiting: 0, rate: 100 }
          return [200, row('a', { outcome: 'yes', outcomeDue: false })]
        },
      }),
    )
    const user = userEvent.setup()
    render(<History />)
    await screen.findByText('“Question a”')
    await user.click(within(entry('Question a')).getByRole('button', { name: 'Yes' }))
    expect(await within(entry('Question a')).findByText('Came true')).toBeTruthy()
    expect(calls.find((c) => c.key === 'PUT /spreads/a/outcome').body).toEqual({ outcome: 'yes' })
    expect(within(await screen.findByRole('region', { name: 'How your readings turned out' })).getByText('Answer 4 more readings to see how often yours come true.')).toBeTruthy()
  })

  test('an answer can be changed and taken back', async () => {
    const calls = mockApi(
      base([row('a', { outcome: 'no' })], { ...STATS, answered: 1, no: 1, waiting: 0 }, {
        'PUT /spreads/a/outcome': [200, row('a', { outcome: 'partly' })],
        'DELETE /spreads/a/outcome': [200, row('a')],
      }),
    )
    const user = userEvent.setup()
    render(<History />)
    await screen.findByText('“Question a”')
    expect(within(entry('Question a')).getByText('Did not come true')).toBeTruthy()
    await user.click(within(entry('Question a')).getByRole('button', { name: 'Change' }))
    await user.click(within(entry('Question a')).getByRole('button', { name: 'Partly' }))
    expect(await within(entry('Question a')).findByText('Partly came true')).toBeTruthy()
    await user.click(within(entry('Question a')).getByRole('button', { name: 'Change' }))
    await user.click(within(entry('Question a')).getByRole('button', { name: 'Remove my answer' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'DELETE /spreads/a/outcome')).toBe(true))
    await waitFor(() => expect(within(entry('Question a')).queryByText('Partly came true')).toBeNull())
  })

  test('the percentage appears only after enough answers, with the recurring cards', async () => {
    mockApi(base([row('a', { outcome: 'yes' })], { total: 8, answered: 6, yes: 3, partly: 2, no: 1, waiting: 0, rate: 67, topCards: [{ id: 16, count: 3 }, { id: 5, count: 2 }] }))
    render(<History />)
    const panel = await screen.findByRole('region', { name: 'How your readings turned out' })
    expect(within(panel).getByText('Your own marks: 67% of readings came true.')).toBeTruthy()
    expect(within(panel).getByText('Card 16 ×3')).toBeTruthy()
    expect(within(panel).getByText('Card 5 ×2')).toBeTruthy()
  })

  test('the Waiting tab shows only readings that wait for an answer', async () => {
    mockApi(base([row('a', { outcomeDue: true }), row('b')]))
    const user = userEvent.setup()
    render(<History />)
    await screen.findByText('“Question a”')
    await user.click(screen.getByRole('tab', { name: /Waiting · 1/ }))
    expect(screen.getByText('“Question a”')).toBeTruthy()
    expect(screen.queryByText('“Question b”')).toBeNull()
  })

  test('without the summary endpoint the history still works', async () => {
    mockApi({ ...base([row('a')]), 'GET /spreads/accuracy': [500, { message: 'boom' }] })
    render(<History />)
    expect(await screen.findByText('“Question a”')).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'How your readings turned out' })).toBeNull()
  })
})
