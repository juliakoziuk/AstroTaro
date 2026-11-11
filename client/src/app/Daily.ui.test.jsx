import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Daily from './Daily.jsx'
import { streakNote } from './streakNote.js'
import { localDay } from './format.js'
import { mockApi } from '../test/setup.js'

const week = (drawnDays) => Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-0${i + 5}`, drawn: drawnDays.includes(i) }))
const hidden = { date: '2026-11-11', drawn: false, card: null, streak: { current: 2, longest: 4, total: 9, drawnToday: false }, week: week([4, 5]) }
const opened = {
  date: '2026-11-11', drawn: true,
  card: { id: 17, name: 'The Star', reversed: true, meaning: 'Lost faith or disconnection.', text: 'A quiet day for renewing hope.' },
  streak: { current: 3, longest: 4, total: 10, drawnToday: true }, week: week([4, 5, 6]),
}

describe('card of the day page', () => {
  test('the card is hidden until opened; opening shows it and the longer streak', async () => {
    const calls = mockApi({ [`GET /tarot/daily?date=${localDay()}`]: [200, hidden], 'POST /tarot/daily': [201, opened] })
    const user = userEvent.setup()
    render(<Daily />)

    expect(await screen.findByText('Open today’s card to keep your streak going.')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy() // серія до відкриття
    expect(screen.queryByText('The Star')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Reveal today’s card' }))
    expect(await screen.findByRole('heading', { name: /The Star/ })).toBeTruthy()
    expect(screen.getByText('A quiet day for renewing hope.')).toBeTruthy()
    expect(screen.getByText('Streak kept for today. Come back tomorrow for a new card.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reveal today’s card' })).toBeNull()

    // дату «сьогодні» беремо з годинника людини й надсилаємо серверові
    expect(calls.find((c) => c.key === 'POST /tarot/daily').body).toEqual({ date: localDay() })
  })

  test('an already opened card is shown at once, with the best streak and cards opened', async () => {
    mockApi({ [`GET /tarot/daily?date=${localDay()}`]: [200, opened] })
    render(<Daily />)
    expect(await screen.findByRole('heading', { name: /The Star/ })).toBeTruthy()
    expect(screen.getByText('Reversed')).toBeTruthy()
    expect(screen.getByText('Best streak').nextSibling.textContent).toBe('4')
    expect(screen.getByText('Cards opened').nextSibling.textContent).toBe('10')
    expect(screen.getAllByRole('listitem').filter((li) => li.className.includes('done')).length).toBe(3)
  })

  test('a failed request says so instead of leaving a blank page', async () => {
    mockApi({ [`GET /tarot/daily?date=${localDay()}`]: [500, { message: 'Server error' }] })
    render(<Daily />)
    expect((await screen.findByRole('alert')).textContent).toMatch(/Server error/)
  })
})

test('the streak note encourages before the card is opened and calms after', () => {
  expect(streakNote({ current: 0, drawnToday: false })).toMatch(/Start a streak/)
  expect(streakNote({ current: 5, drawnToday: false })).toMatch(/keep your streak/)
  expect(streakNote({ current: 5, drawnToday: true })).toMatch(/Come back tomorrow/)
})
