import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PricingPage from './PricingPage.jsx'
import { choosePlan } from './pricing.js'
import { forgetRecentGets, setToken } from '../../lib/api.js'
import { mockApi } from '../../test/setup.js'

const PLANS = [{ id: 'free', name: 'Free', price: 0, features: [] }, { id: 'pro', name: 'Pro', price: 5, features: [] }, { id: 'premium', name: 'Premium', price: 10, features: [] }]
const withState = (extra) => ({ data: { plans: PLANS, current: 'free', subscribed: false, ...extra }, go: vi.fn(), say: vi.fn() })
// кнопки тарифів за порядком на екрані: 0 — Free (Get Started), 1 — Pro (Upgrade), 2 — Premium (Choose)
const press = (i, c) => choosePlan(c.data.plans[i], c.data, c)

describe('pricing buttons', () => {
  test('a guest is sent to register and nothing is requested', async () => {
    const calls = mockApi({})
    const c = withState({})
    await press(1, c)
    expect(c.go).toHaveBeenCalledWith('/register')
    expect(calls).toHaveLength(0)
  })

  test('a paid plan starts a Stripe checkout and never switches the plan directly', async () => {
    setToken('tok')
    const calls = mockApi({ 'POST /billing/checkout': [201, { url: 'about:blank#pay' }] })
    const c = withState({})
    await press(1, c)
    expect(calls.map((x) => x.key)).toEqual(['POST /billing/checkout'])
    expect(calls[0].body).toEqual({ plan: 'pro' })
    expect(c.go).not.toHaveBeenCalled() // людину веде Stripe, а не наш екран
  })

  test('in demo mode (no Stripe) the plan turns on at once and the dashboard opens', async () => {
    setToken('tok')
    mockApi({ 'POST /billing/checkout': [201, { activated: true, plan: 'premium' }] })
    const c = withState({})
    await press(2, c)
    expect(c.say).toHaveBeenCalledWith(expect.stringMatching(/Demo mode: Premium was switched on without payment/))
    expect(c.go).toHaveBeenCalledWith('/dashboard')
  })

  test('an answer with neither a payment url nor an explicit demo activation is an error, not a trip to the dashboard', async () => {
    setToken('tok')
    mockApi({ 'POST /billing/checkout': [201, {}] })
    const c = withState({})
    await expect(press(1, c)).rejects.toThrow(/payment page could not be opened/)
    expect(c.go).not.toHaveBeenCalled()
    expect(c.say).not.toHaveBeenCalled()
  })

  test('a demo answer for another plan than the one requested is not trusted either', async () => {
    setToken('tok')
    mockApi({ 'POST /billing/checkout': [201, { activated: true, plan: 'premium' }] })
    const c = withState({})
    await expect(press(1, c)).rejects.toThrow(/payment page could not be opened/)
    expect(c.go).not.toHaveBeenCalled()
  })

  test('the free plan uses the plain plan endpoint, not Stripe', async () => {
    setToken('tok')
    const calls = mockApi({ 'POST /billing/plan': [201, { plan: 'free' }] })
    const c = withState({ current: 'pro' })
    await press(0, c)
    expect(calls.map((x) => x.key)).toEqual(['POST /billing/plan'])
    expect(c.go).toHaveBeenCalledWith('/dashboard')
  })

  test('when payment is unavailable the server message reaches the person', async () => {
    setToken('tok')
    mockApi({ 'POST /billing/checkout': [403, { message: 'Paid plans cannot be activated yet: online payment is not connected' }] })
    await expect(press(1, withState({}))).rejects.toThrow(/online payment is not connected/)
  })
})

describe('pricing reflects the state of the subscription', () => {
  test('the button of the current plan only says so: no checkout, no plan change', async () => {
    setToken('tok')
    const calls = mockApi({})
    const c = withState({ current: 'pro' })
    await press(1, c)
    expect(c.say).toHaveBeenCalledWith('This is your current plan.')
    expect(calls).toHaveLength(0)
    expect(c.go).not.toHaveBeenCalled()
  })

  test('a free user pressing Free is told it is the current plan', async () => {
    setToken('tok')
    const calls = mockApi({})
    const c = withState({ current: 'free' })
    await press(0, c)
    expect(c.say).toHaveBeenCalledWith('This is your current plan.')
    expect(calls).toHaveLength(0)
  })

  test('a subscriber changing to another plan or to Free goes to the portal, never to checkout', async () => {
    setToken('tok')
    for (const i of [2, 0]) {
      const calls = mockApi({ 'POST /billing/portal': [201, { url: 'about:blank#portal' }] })
      await press(i, withState({ current: 'pro', subscribed: true }))
      expect(calls.map((x) => x.key)).toEqual(['POST /billing/portal'])
    }
  })

  test('a free user keeps the normal paths: checkout for a paid plan', async () => {
    setToken('tok')
    const calls = mockApi({ 'POST /billing/checkout': [201, { url: 'about:blank#pay' }] })
    await press(2, withState({ current: 'free' }))
    expect(calls.map((x) => x.key)).toEqual(['POST /billing/checkout'])
    expect(calls[0].body).toEqual({ plan: 'premium' })
  })
})

describe('the pricing screen', () => {
  const billing = (plan, canManage) => ({ plan, options: { canManage } })

  test('the plan the person is on says "Your plan" instead of a button; the others keep theirs', async () => {
    setToken('tok')
    mockApi({ 'GET /plans': [200, PLANS], 'GET /billing': [200, billing('pro', false)] })
    render(<PricingPage />)
    expect(await screen.findByText('Your plan')).toBeTruthy()
    expect(screen.getAllByText('Your plan')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Choose' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Upgrade' })).toBeNull() // Pro — поточний тариф
  })

  test('a guest sees all three buttons and no "Your plan"', async () => {
    mockApi({ 'GET /plans': [200, PLANS] })
    render(<PricingPage />)
    await screen.findByRole('button', { name: 'Upgrade' })
    expect(screen.queryByText('Your plan')).toBeNull()
  })

  test('"Manage subscription" shows only for a subscriber and opens the Stripe portal', async () => {
    setToken('tok')
    mockApi({ 'GET /plans': [200, PLANS], 'GET /billing': [200, billing('free', false)] })
    const none = render(<PricingPage />)
    await screen.findByRole('button', { name: 'Upgrade' })
    expect(screen.queryByRole('button', { name: 'Manage subscription' })).toBeNull()
    none.unmount()
    forgetRecentGets() // однакові GET за кілька секунд ділять відповідь: тут потрібна нова

    const calls = mockApi({ 'GET /plans': [200, PLANS], 'GET /billing': [200, billing('pro', true)], 'POST /billing/portal': [201, { url: 'about:blank#portal' }] })
    render(<PricingPage />)
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Manage subscription' }))
    await waitFor(() => expect(calls.map((c) => c.key)).toContain('POST /billing/portal'))
  })
})
