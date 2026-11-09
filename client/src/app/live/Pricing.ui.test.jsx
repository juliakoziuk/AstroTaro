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
    expect(c.say).toHaveBeenCalledWith('Plan: Premium')
    expect(c.go).toHaveBeenCalledWith('/dashboard')
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
