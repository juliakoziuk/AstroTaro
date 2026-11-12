import { describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Onboarding from './Onboarding.jsx'
import { session } from './live/common.js'
import { mockApi } from '../test/setup.js'

const BIG = {
  sun: { sign: 'Pisces', signName: 'Pisces', text: 'Sun text' },
  moon: { sign: 'Leo', signName: 'Leo', text: 'Moon text' },
  ascendant: null,
}
const ROUTES = {
  'PATCH /profile': [200, {}],
  'GET /astrology/big-three': [200, BIG],
  'POST /profile/onboarding': [201, { onboarded: true, interests: [] }],
}
const fillBirth = async (user, date = '1999-03-14') => {
  await user.type(screen.getByLabelText('Date of birth'), date)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

describe('onboarding', () => {
  test('the four steps: interests, birth details, big three, first card', async () => {
    const calls = mockApi(ROUTES)
    const user = userEvent.setup()
    render(<Onboarding />)

    await user.click(screen.getByRole('button', { name: /Dreams/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await fillBirth(user)
    expect(calls.find((c) => c.key === 'PATCH /profile').body).toEqual({ birthDate: '1999-03-14' })

    expect(await screen.findByText('Sun text')).toBeTruthy()
    expect(screen.getByText('Moon text')).toBeTruthy()
    // без часу й міста Асцендента немає: підказка й спосіб його додати
    expect(screen.getByText(/to reveal your Ascendant/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await user.type(screen.getByLabelText('Your question (optional)'), '  What should I focus on?  ')
    await user.click(screen.getByRole('button', { name: 'Draw my first card' }))
    await waitFor(() => expect(window.location.hash).toBe('#/draw'))

    expect(calls.find((c) => c.key === 'POST /profile/onboarding').body).toEqual({ interests: ['dreams'] })
    expect(JSON.parse(session.get('draw'))).toEqual({ spreadId: 'daily', deck: 'Classic Tarot', mode: 'quick', question: 'What should I focus on?' })
    expect(window.location.hash).toBe('#/draw')
  })

  test('skipping marks onboarding done without touching the profile', async () => {
    const calls = mockApi(ROUTES)
    const user = userEvent.setup()
    render(<Onboarding />)
    await user.click(screen.getByRole('button', { name: 'Skip for now' }))
    await waitFor(() => expect(window.location.hash).toBe('#/dashboard'))
    expect(calls.map((c) => c.key)).toEqual(['POST /profile/onboarding'])
    expect(calls[0].body).toEqual({ interests: [] })
    expect(window.location.hash).toBe('#/dashboard')
  })

  test('the birth step needs a date, or can be postponed', async () => {
    const calls = mockApi(ROUTES)
    const user = userEvent.setup()
    render(<Onboarding />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/Enter your date of birth/)
    expect(calls).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'I will add it later' }))
    expect(screen.getByRole('heading', { name: 'Your first card' })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('"Not now" goes to the first thing the person picked', async () => {
    mockApi(ROUTES)
    const user = userEvent.setup()
    render(<Onboarding />)
    await user.click(screen.getByRole('button', { name: /Astrology/ }))
    await user.click(screen.getByRole('button', { name: /Dreams/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'I will add it later' }))
    await user.click(screen.getByRole('button', { name: 'Not now' }))
    await waitFor(() => expect(window.location.hash).toBe('#/astrology'))
  })

  test('a server error on the birth step is shown and the step stays', async () => {
    mockApi({ ...ROUTES, 'GET /astrology/big-three': [403, { message: 'Add a date of birth first.' }] })
    const user = userEvent.setup()
    render(<Onboarding />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await fillBirth(user)
    expect((await screen.findByRole('alert')).textContent).toMatch(/Add a date of birth first/)
    expect(screen.getByRole('heading', { name: 'Your birth details' })).toBeTruthy()
  })
})
