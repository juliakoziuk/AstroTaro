import { describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import History from './History.jsx'
import SharedReading from './SharedReading.jsx'
import { mockApi } from '../test/setup.js'

const TOKEN = 'k'.repeat(43)
const SPREADS = [{ id: 'three', name: 'Three cards', positions: ['Past', 'Present', 'Future'] }]
const reading = {
  date: '2026-03-10T10:00:00.000Z', spreadId: 'three', deck: 'Classic Tarot', mode: 'quick', question: 'Should I move?',
  cards: [{ id: 0, reversed: false }, { id: 1, reversed: true }, { id: 2, reversed: false }],
  result: { summary: 'A calm outlook.', positions: [{ label: 'Past', card: 'The Fool', reversed: false }, { label: 'Present', card: 'The Magician', reversed: true }, { label: 'Future', card: 'The High Priestess', reversed: false }] },
}

describe('public shared reading page', () => {
  test('shows the question, the cards with their positions and the interpretation', async () => {
    window.location.hash = `#/shared?token=${TOKEN}`
    const calls = mockApi({ [`GET /shared/${TOKEN}`]: [200, reading], 'GET /tarot/spreads': [200, SPREADS] })
    render(<SharedReading />)
    expect(await screen.findByRole('heading', { name: 'Three cards' })).toBeTruthy()
    expect(screen.getByText('“Should I move?”')).toBeTruthy()
    expect(screen.getByText('The Magician · Reversed')).toBeTruthy()
    expect(screen.getByText('A calm outlook.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Make your own reading' }).getAttribute('href')).toBe('#/register')
    expect(calls.every((c) => !c.headers.Authorization)).toBe(true) // страниця працює без входу
  })

  test('a revoked or wrong link gets a clear message instead of a reading', async () => {
    window.location.hash = `#/shared?token=${TOKEN}`
    mockApi({ [`GET /shared/${TOKEN}`]: [404, { message: 'Record not found' }], 'GET /tarot/spreads': [200, SPREADS] })
    render(<SharedReading />)
    expect((await screen.findByRole('alert')).textContent).toMatch(/not shared any more/)
  })

  test('a link without a token says so', () => {
    window.location.hash = '#/shared'
    mockApi({})
    render(<SharedReading />)
    expect(screen.getByRole('alert').textContent).toMatch(/no token/)
  })
})

describe('sharing from the history', () => {
  const stored = { id: 'r1', date: '2026-03-10T10:00:00.000Z', spreadId: 'three', saved: false, shareToken: null, question: '', cards: reading.cards, result: reading.result }

  test('Share creates a link, shows it, copies it; Stop sharing revokes it', async () => {
    const url = `http://localhost:5173/app.html#/shared?token=${TOKEN}`
    const calls = mockApi({
      'GET /spreads': [200, [stored]],
      'GET /tarot/spreads': [200, SPREADS],
      'GET /settings': [200, { dateFormat: 'DD/MM/YYYY', timeFormat: '24-hour' }],
      'POST /spreads/r1/share': [201, { token: TOKEN, path: `/shared?token=${TOKEN}`, url }],
      'DELETE /spreads/r1/share': [204, null],
    })
    const user = userEvent.setup()
    render(<History />)
    await user.click(await screen.findByRole('button', { name: 'Share reading' }))
    const box = await screen.findByRole('group', { name: 'Share reading' })
    expect(box.querySelector('input').value).toBe(url)
    await waitFor(async () => expect(await navigator.clipboard.readText()).toBe(url)) // userEvent подає тестову заміну буфера
    expect((await screen.findByText('Link copied')).getAttribute('role')).toBe('status')
    expect(screen.getByRole('button', { name: 'Share reading' }).className).toMatch(/\bon\b/) // позначено як «поширюється»

    await user.click(screen.getByRole('button', { name: 'Stop sharing' }))
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Share reading' })).toBeNull())
    expect(calls.map((c) => c.key)).toContain('DELETE /spreads/r1/share')
    expect(screen.getByRole('button', { name: 'Share reading' }).className).not.toMatch(/\bon\b/)
  })

  test('a failed share shows the error and no link', async () => {
    mockApi({
      'GET /spreads': [200, [stored]],
      'GET /tarot/spreads': [200, SPREADS],
      'GET /settings': [200, { dateFormat: 'DD/MM/YYYY', timeFormat: '24-hour' }],
      'POST /spreads/r1/share': [404, { message: 'Record not found' }],
    })
    const user = userEvent.setup()
    render(<History />)
    await user.click(await screen.findByRole('button', { name: 'Share reading' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Record not found')
    expect(screen.queryByRole('group', { name: 'Share reading' })).toBeNull()
  })
})
