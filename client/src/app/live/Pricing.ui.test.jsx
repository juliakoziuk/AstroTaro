import { describe, expect, test, vi } from 'vitest'
import { pricing } from './simple.jsx'
import { setToken } from '../../lib/api.js'
import { mockApi } from '../../test/setup.js'

const PLANS = [{ id: 'free', name: 'Free', price: 0 }, { id: 'pro', name: 'Pro', price: 5 }, { id: 'premium', name: 'Premium', price: 10 }]
const ctx = () => ({ data: { plans: PLANS }, go: vi.fn(), say: vi.fn() })

describe('pricing buttons', () => {
  test('a guest is sent to register and nothing is requested', async () => {
    const calls = mockApi({})
    const c = ctx()
    await pricing.actions.Upgrade(c)
    expect(c.go).toHaveBeenCalledWith('/register')
    expect(calls).toHaveLength(0)
  })

  test('a paid plan starts a Stripe checkout and never switches the plan directly', async () => {
    setToken('tok')
    const calls = mockApi({ 'POST /billing/checkout': [201, { url: 'about:blank#pay' }] })
    const c = ctx()
    await pricing.actions.Upgrade(c)
    expect(calls.map((x) => x.key)).toEqual(['POST /billing/checkout'])
    expect(calls[0].body).toEqual({ plan: 'pro' })
    expect(c.go).not.toHaveBeenCalled() // человека веде Stripe, а не наш екран
  })

  test('in demo mode (no Stripe) the plan turns on at once and the dashboard opens', async () => {
    setToken('tok')
    mockApi({ 'POST /billing/checkout': [201, { activated: true, plan: 'premium' }] })
    const c = ctx()
    await pricing.actions.Choose(c)
    expect(c.say).toHaveBeenCalledWith(expect.stringMatching(/Demo mode: Premium was switched on without payment/))
    expect(c.go).toHaveBeenCalledWith('/dashboard')
  })

  test('an answer with neither a payment url nor an explicit demo activation is an error, not a trip to the dashboard', async () => {
    setToken('tok')
    mockApi({ 'POST /billing/checkout': [201, {}] })
    const c = ctx()
    await expect(pricing.actions.Upgrade(c)).rejects.toThrow(/payment page could not be opened/)
    expect(c.go).not.toHaveBeenCalled()
    expect(c.say).not.toHaveBeenCalled()
  })

  test('a demo answer for another plan than the one requested is not trusted either', async () => {
    setToken('tok')
    mockApi({ 'POST /billing/checkout': [201, { activated: true, plan: 'premium' }] })
    const c = ctx()
    await expect(pricing.actions.Upgrade(c)).rejects.toThrow(/payment page could not be opened/)
    expect(c.go).not.toHaveBeenCalled()
  })

  test('the free plan uses the plain plan endpoint, not Stripe', async () => {
    setToken('tok')
    const calls = mockApi({ 'POST /billing/plan': [201, { plan: 'free' }] })
    const c = ctx()
    await pricing.actions['Get Started'](c)
    expect(calls.map((x) => x.key)).toEqual(['POST /billing/plan'])
    expect(c.go).toHaveBeenCalledWith('/dashboard')
  })

  test('when payment is unavailable the server message reaches the person', async () => {
    setToken('tok')
    mockApi({ 'POST /billing/checkout': [403, { message: 'Paid plans cannot be activated yet: online payment is not connected' }] })
    await expect(pricing.actions.Upgrade(ctx())).rejects.toThrow(/online payment is not connected/)
  })
})

describe('manage subscription', () => {
  test('the button shows only for a subscriber and opens the Stripe portal', async () => {
    const { render, screen } = await import('@testing-library/react')
    const userEvent = (await import('@testing-library/user-event')).default
    setToken('tok')
    const calls = mockApi({ 'POST /billing/portal': [201, { url: 'about:blank#portal' }] })
    const none = render(pricing.Over({ ctx: { data: { subscribed: false }, run: (fn) => fn() } }) ?? <p />)
    expect(none.container.querySelector('button')).toBeNull()
    none.unmount()
    render(pricing.Over({ ctx: { data: { subscribed: true }, run: (fn) => fn() } }))
    await userEvent.setup().click(screen.getByRole('button', { name: 'Manage subscription' }))
    expect(calls.map((c) => c.key)).toEqual(['POST /billing/portal'])
  })
})

describe('pricing reflects the state of the subscription', () => {
  const withState = (extra) => ({ data: { plans: PLANS, current: 'free', subscribed: false, ...extra }, go: vi.fn(), say: vi.fn() })

  test('the button of the current plan only says so: no checkout, no plan change', async () => {
    setToken('tok')
    const calls = mockApi({})
    const c = withState({ current: 'pro' })
    await pricing.actions.Upgrade(c)
    expect(c.say).toHaveBeenCalledWith('This is your current plan.')
    expect(calls).toHaveLength(0)
    expect(c.go).not.toHaveBeenCalled()
  })

  test('a free user pressing Free is told it is the current plan', async () => {
    setToken('tok')
    const calls = mockApi({})
    const c = withState({ current: 'free' })
    await pricing.actions['Get Started'](c)
    expect(c.say).toHaveBeenCalledWith('This is your current plan.')
    expect(calls).toHaveLength(0)
  })

  test('a subscriber changing to another plan or to Free goes to the portal, never to checkout', async () => {
    setToken('tok')
    for (const label of ['Choose', 'Get Started']) {
      const calls = mockApi({ 'POST /billing/portal': [201, { url: 'about:blank#portal' }] })
      await pricing.actions[label](withState({ current: 'pro', subscribed: true }))
      expect(calls.map((x) => x.key)).toEqual(['POST /billing/portal'])
    }
  })

  test('a free user keeps the normal paths: checkout for a paid plan', async () => {
    setToken('tok')
    const calls = mockApi({ 'POST /billing/checkout': [201, { url: 'about:blank#pay' }] })
    await pricing.actions.Choose(withState({ current: 'free' }))
    expect(calls.map((x) => x.key)).toEqual(['POST /billing/checkout'])
    expect(calls[0].body).toEqual({ plan: 'premium' })
  })

  test('the badge "Your plan" covers the button of the current plan only', async () => {
    const { render, screen } = await import('@testing-library/react')
    const first = render(pricing.Over({ ctx: withState({ current: 'pro' }) }))
    expect(screen.getAllByText('Your plan')).toHaveLength(1)
    first.unmount()
    const guest = render(pricing.Over({ ctx: withState({ current: null }) }))
    expect(guest.container.textContent).toBe('')
  })
})
