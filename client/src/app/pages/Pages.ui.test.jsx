import { describe, expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard.jsx'
import ProfilePage from './ProfilePage.jsx'
import ReadingPage from './ReadingPage.jsx'
import RegisterPage from './RegisterPage.jsx'
import TarotStudio from './TarotStudio.jsx'
import { Dreams } from './DreamsPage.jsx'
import { startReading } from './tarotStart.js'
import { setToken } from '../../lib/api.js'
import { session } from '../live/common.js'
import { mockApi } from '../../test/setup.js'

const SETTINGS = { notifications: true, dateFormat: 'DD/MM/YYYY', timeFormat: '24-hour', language: 'English', theme: 'Dark' }

describe('dashboard', () => {
  test('shows the greeting with the name, the six sections and the numbers from the server', async () => {
    setToken('tok')
    mockApi({ 'GET /dashboard': [200, { name: 'Julia', counts: { readings: 12, dreams: 5, journal: 8, reports: 2 }, progress: 43, insight: 'A quiet month.' }], 'GET /profile': [200, { name: 'Julia' }] })
    render(<Dashboard />)
    expect(await screen.findByRole('heading', { name: /Julia/ })).toBeTruthy()
    const main = within(screen.getByRole('main'))
    for (const name of ['Tarot', 'Dreams', 'Astrology', 'Journal', 'Cosmic Today', 'Progress']) expect(main.getByRole('link', { name: new RegExp(`^${name}`) })).toBeTruthy()
    expect(screen.getByText('A quiet month.')).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Your Progress' }).getAttribute('aria-valuenow')).toBe('43')
  })

  test('a failed load says so and offers to retry instead of an empty page', async () => {
    setToken('tok')
    mockApi({})
    render(<Dashboard />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })
})

describe('tarot studio', () => {
  const SPREADS = [{ id: 'daily', name: 'Daily Card', positions: ['Today'] }, { id: 'three', name: 'Three Cards', positions: ['Past', 'Present', 'Future'] }, { id: 'career', name: 'Career', positions: ['Now', 'Obstacle'] }]

  test('the chosen spread and mode are remembered and the draw screen opens', async () => {
    setToken('tok')
    mockApi({ 'GET /tarot/spreads': [200, SPREADS], 'GET /billing': [200, { limits: { readingModes: ['quick', 'detailed'] } }] })
    const user = userEvent.setup()
    render(<TarotStudio />)
    await user.click(await screen.findByRole('button', { name: /Career/ }))
    await user.click(screen.getByRole('radio', { name: 'Detailed' }))
    await user.click(screen.getByRole('button', { name: 'Start Reading' }))
    expect(JSON.parse(session.get('draw'))).toEqual({ spreadId: 'career', mode: 'detailed' })
    expect(window.location.hash).toBe('#/draw')
  })

  test('the daily card is not a spread: it opens its own page', async () => {
    setToken('tok')
    mockApi({ 'GET /tarot/spreads': [200, SPREADS], 'GET /billing': [200, { limits: null }] })
    render(<TarotStudio />)
    await userEvent.setup().click(await screen.findByRole('button', { name: /Daily Card/ }))
    expect(window.location.hash).toBe('#/daily')
  })

  test('a mode outside the plan is refused with the reason, nothing is remembered', () => {
    expect(() => startReading('three', 'depth', { readingModes: ['quick'] })).toThrow('Depth readings are included in Premium.')
    expect(() => startReading('three', 'detailed', { readingModes: ['quick'] })).toThrow('Detailed readings are included in Pro and Premium.')
    expect(session.get('draw')).toBeNull()
  })
})

describe('reading', () => {
  const pos = (label, card) => ({ label, card, meaning: `${card} meaning`, detail: `${card} in full` })
  const READING = { id: 'r1', spreadId: 'three', mode: 'quick', question: '', cards: [{ id: 0, reversed: false }, { id: 1, reversed: true }], result: { summary: 'The whole story.', positions: [pos('Past', 'The Moon'), pos('Future', 'The Star')] } }
  const routes = { 'GET /spreads/r1': [200, READING], 'GET /tarot/spreads': [200, [{ id: 'three', name: 'Three Cards', positions: [] }]], 'PATCH /spreads/r1': [200, {}] }

  test('shows the spread, each position and the interpretation; a position opens its full text', async () => {
    setToken('tok')
    session.set('readingId', 'r1')
    mockApi(routes)
    const user = userEvent.setup()
    render(<ReadingPage />)
    expect(await screen.findByRole('heading', { name: 'Three Cards' })).toBeTruthy()
    expect(screen.getByText('The whole story.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Past: The Moon' }))
    expect(within(screen.getByRole('dialog')).getByText('The Moon in full')).toBeTruthy()
  })

  test('saving marks the reading as saved and opens the saved list of the history', async () => {
    setToken('tok')
    session.set('readingId', 'r1')
    const calls = mockApi(routes)
    render(<ReadingPage />)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Save Reading' }))
    await waitFor(() => expect(window.location.hash).toBe('#/history'))
    expect(calls.find((c) => c.key === 'PATCH /spreads/r1').body).toEqual({ saved: true })
    expect(session.get('historyFilter')).toBe('saved')
  })
})

describe('dream journal', () => {
  const dream = (id, title, text) => ({ id, title, text, date: '2026-10-28T10:00:00Z', kind: 'Dream', symbols: ['House'], analysis: { interpretation: `About ${title}`, keyMeanings: [] } })
  const DREAMS = [dream('a', 'The Old House', 'An old house.'), dream('b', 'The Forest', 'A dark forest.')]

  test('the list selects a dream and the right panel follows it', async () => {
    mockApi({ 'GET /dreams': [200, DREAMS], 'GET /settings': [200, SETTINGS], 'GET /cosmos/art': [404, {}] })
    const user = userEvent.setup()
    render(<Dreams />)
    expect(await screen.findByText('About The Old House')).toBeTruthy() // перший сон вибраний одразу
    await user.click(screen.getByRole('button', { name: /The Forest/ }))
    expect(await screen.findByText('About The Forest')).toBeTruthy()
    expect(screen.queryByText('About The Old House')).toBeNull()
    expect(session.get('dreamId')).toBe('b')
  })

  test('without dreams the person is invited to write the first one', async () => {
    mockApi({ 'GET /dreams': [200, []], 'GET /settings': [200, SETTINGS] })
    render(<Dreams />)
    expect(await screen.findByText('No dreams yet')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Add dream|New Entry/ }).length).toBeGreaterThan(0)
  })
})

describe('profile', () => {
  const PROFILE = { name: 'Julia', email: 'j@example.com', birthDate: '2004-06-22', plan: 'free', activity: { readings: 24, dreams: 18, reports: 5 } }

  test('shows the account and the numbers; the notifications switch is saved at once', async () => {
    setToken('tok')
    const calls = mockApi({ 'GET /profile': [200, PROFILE], 'GET /settings': [200, SETTINGS], 'PATCH /settings': [200, {}] })
    render(<ProfilePage />)
    expect(await screen.findByRole('heading', { name: 'Julia' })).toBeTruthy()
    expect(screen.getByText('24')).toBeTruthy()
    await userEvent.setup().click(screen.getByRole('switch', { name: 'Notifications' }))
    await waitFor(() => expect(calls.find((c) => c.key === 'PATCH /settings')?.body).toEqual({ notifications: false }))
  })
})

describe('register', () => {
  const fill = async (user, { password = 'secret-pass-1', confirm = password, terms = true } = {}) => {
    await user.type(screen.getByLabelText('Full name'), 'Julia')
    await user.type(screen.getByLabelText('Email address'), 'j@example.com')
    await user.type(screen.getByLabelText('Password'), password)
    await user.type(screen.getByLabelText('Confirm password'), confirm)
    if (terms) await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Create Account' }))
  }

  test('different passwords or no agreement are stopped before any request', async () => {
    const calls = mockApi({})
    const user = userEvent.setup()
    render(<RegisterPage />)
    await fill(user, { confirm: 'other-pass-1' })
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Passwords do not match')
    await user.click(screen.getByRole('checkbox')) // знімаємо згоду й вирівнюємо паролі
    await user.clear(screen.getByLabelText('Confirm password'))
    await user.type(screen.getByLabelText('Confirm password'), 'secret-pass-1')
    await user.click(screen.getByRole('button', { name: 'Create Account' }))
    expect((await screen.findByRole('alert')).textContent).toBe('You need to agree to the terms')
    expect(calls).toHaveLength(0)
  })

  test('a valid form creates the account and opens the dashboard', async () => {
    const calls = mockApi({ 'POST /auth/register': [201, { token: 'new', user: { id: 'u' } }], 'PATCH /settings': [200, {}] })
    render(<RegisterPage />)
    await fill(userEvent.setup())
    await waitFor(() => expect(window.location.hash).toBe('#/dashboard'))
    expect(calls.find((c) => c.key === 'POST /auth/register').body).toEqual({ name: 'Julia', email: 'j@example.com', password: 'secret-pass-1' })
  })
})
