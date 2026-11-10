import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BillingPanel } from './BillingPanel.jsx'
import { setToken } from '../../lib/api.js'
import { mockApi } from '../../test/setup.js'

const LIMITS = {
  free: { readingsPerMonth: 5, dreamsTotal: 10, aiMessagesPerDay: 10, readingModes: ['quick'], compatibility: false, forecastRanges: ['day'], fullReports: false },
  pro: { readingsPerMonth: 60, dreamsTotal: 200, aiMessagesPerDay: 40, readingModes: ['quick', 'detailed'], compatibility: true, forecastRanges: ['day', 'week', 'month'], fullReports: true },
  premium: { readingsPerMonth: null, dreamsTotal: null, aiMessagesPerDay: 200, readingModes: ['quick', 'detailed', 'depth'], compatibility: true, forecastRanges: ['day', 'week', 'month'], fullReports: true },
}
const PRICE = { free: 0, pro: 5, premium: 10 }

/** Ответ GET /billing для тарифу plan; overrides зливаються поверх. */
const overview = (plan = 'free', overrides = {}) => ({
  plan, planName: plan[0].toUpperCase() + plan.slice(1), price: PRICE[plan], interval: 'month',
  subscription: null,
  limits: LIMITS[plan],
  usage: { readingsThisMonth: 2, dreamsTotal: 3, aiMessagesToday: 1 },
  remaining: { readings: LIMITS[plan].readingsPerMonth === null ? null : LIMITS[plan].readingsPerMonth - 2, dreams: LIMITS[plan].dreamsTotal === null ? null : LIMITS[plan].dreamsTotal - 3, aiMessages: LIMITS[plan].aiMessagesPerDay - 1 },
  resets: { readings: '2026-12-01T00:00:00.000Z', aiMessages: '2026-11-10T00:00:00.000Z' },
  options: { canUpgradeTo: plan === 'free' ? ['pro', 'premium'] : plan === 'pro' ? ['premium'] : [], canManage: false, needsPaymentFix: false },
  ...overrides,
})
const subscription = (extra = {}) => ({ status: 'active', cancelAtPeriodEnd: false, currentPeriodEnd: '2026-12-09T10:00:00.000Z', ...extra })
const ctx = () => ({ go: vi.fn(), data: { settings: { dateFormat: 'YYYY-MM-DD' } } })
const show = async (body, status = 200) => {
  mockApi({ 'GET /billing': [status, body], 'POST /billing/portal': [201, { url: 'about:blank#portal' }] })
  const c = ctx()
  render(<BillingPanel ctx={c} />)
  return c
}

describe('Billing tab: a free user', () => {
  test('sees the plan, what was used and what is left, and an upgrade button', async () => {
    const c = await show(overview('free'))
    expect(await screen.findByRole('heading', { name: 'Free', level: 3 })).toBeTruthy()
    expect(screen.getByText('Free forever')).toBeTruthy()
    const bars = screen.getAllByRole('progressbar')
    expect(bars).toHaveLength(3)
    const readings = screen.getByRole('progressbar', { name: 'Readings this month' })
    expect(readings.getAttribute('aria-valuenow')).toBe('2')
    expect(readings.getAttribute('aria-valuemax')).toBe('5')
    expect(screen.getByText('2 of 5')).toBeTruthy()
    expect(screen.getByText('3 of 10')).toBeTruthy()
    expect(screen.getByText('1 of 10')).toBeTruthy()
    expect(screen.getAllByText(/^Resets /).length).toBe(2) // розклади й повідомлення ШІ оновлюються, сни — ні
    expect(screen.queryByText(/Manage subscription/)).toBeNull()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Upgrade' }))
    expect(c.go).toHaveBeenCalledWith('/pricing')
  })

  test('sees what the plan includes and what it does not', async () => {
    await show(overview('free'))
    await screen.findByText('Quick readings')
    expect(screen.getByText('Quick readings').closest('li').className).toBe('yes')
    expect(screen.getByText('Detailed readings').closest('li').className).toBe('no')
    expect(screen.getByText('Depth readings').closest('li').className).toBe('no')
    expect(screen.getByText('Forecast for today').closest('li').className).toBe('yes')
    expect(screen.getByText('Forecast for the week').closest('li').className).toBe('no')
    expect(screen.getByText('Compatibility').closest('li').className).toBe('no')
    expect(screen.getByText('Full astrology reports').closest('li').className).toBe('no')
  })

  test('a used-up meter warns and points to the plans', async () => {
    await show(overview('free', { usage: { readingsThisMonth: 5, dreamsTotal: 3, aiMessagesToday: 1 } }))
    const bar = await screen.findByRole('progressbar', { name: 'Readings this month' })
    expect(bar.getAttribute('aria-valuenow')).toBe('5')
    expect(bar.closest('.billing-meter').className).toMatch(/full/)
    expect(screen.getByText('You have used all of it. See plans to get more.')).toBeTruthy()
    expect(screen.getAllByText(/You have used all of it/)).toHaveLength(1)
  })
})

describe('Billing tab: subscribers', () => {
  test('pro with an active subscription: capped meters with their numbers, the renewal date and the portal button show', async () => {
    setToken('tok')
    const c = await show(overview('pro', { subscription: subscription(), options: { canUpgradeTo: ['premium'], canManage: true, needsPaymentFix: false } }))
    expect(await screen.findByRole('heading', { name: 'Pro', level: 3 })).toBeTruthy()
    expect(screen.getByText('$5 per month')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
    expect(screen.getByText(/^Renews on /)).toBeTruthy()
    expect(screen.getAllByRole('progressbar')).toHaveLength(3) // Pro має щедрі, але ліміти: розклади, сни, повідомлення ШІ
    expect(screen.getByText('2 of 60')).toBeTruthy()
    expect(screen.getByText('3 of 200')).toBeTruthy()
    expect(screen.getByText('1 of 40')).toBeTruthy()
    expect(screen.queryByText('Unlimited')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Upgrade' })).toBeNull()

    const calls = []
    mockApi({ 'POST /billing/portal': (init) => (calls.push(init), [201, { url: 'about:blank#portal' }]) })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Manage subscription, payment method and invoices' }))
    expect(calls).toHaveLength(1)

    await userEvent.setup().click(screen.getByRole('button', { name: 'See plans' }))
    expect(c.go).toHaveBeenCalledWith('/pricing')
  })

  test('a subscription that ends: the badge and the date say so', async () => {
    await show(overview('pro', { subscription: subscription({ cancelAtPeriodEnd: true }), options: { canUpgradeTo: ['premium'], canManage: true, needsPaymentFix: false } }))
    expect(await screen.findByText(/^Cancels on /)).toBeTruthy()
    expect(screen.getByText(/^Access until /)).toBeTruthy()
    expect(screen.queryByText(/^Renews on /)).toBeNull()
  })

  test('a payment problem is a prominent warning with the way to fix it', async () => {
    await show(overview('pro', { subscription: subscription({ status: 'past_due' }), options: { canUpgradeTo: ['premium'], canManage: true, needsPaymentFix: true } }))
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/We could not charge your card\. Update the payment method to keep Pro\./)).toBeTruthy()
    expect(screen.getByText('Payment problem')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Manage subscription, payment method and invoices' })).toBeTruthy()
  })

  test('premium has nothing more to upgrade to', async () => {
    await show(overview('premium', { subscription: subscription(), options: { canUpgradeTo: [], canManage: true, needsPaymentFix: false } }))
    await screen.findByRole('heading', { name: 'Premium', level: 3 })
    expect(screen.getAllByText('Unlimited')).toHaveLength(2) // розклади й сни без обмежень
    expect(screen.getAllByRole('progressbar')).toHaveLength(1) // лише повідомлення ШІ мають ліміт
    expect(screen.queryByRole('button', { name: 'See plans' })).toBeNull()
    expect(screen.getByText('Depth readings').closest('li').className).toBe('yes')
  })

  test('a paid plan without a subscription is shown as a demo plan, with no portal button', async () => {
    await show(overview('premium', { subscription: null, options: { canUpgradeTo: [], canManage: false, needsPaymentFix: false } }))
    expect(await screen.findByText('Demo')).toBeTruthy()
    expect(screen.getByText('This plan was switched on in demo mode, without payment.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Manage subscription/ })).toBeNull()
  })

  test('a failed portal call shows the error and does not leave', async () => {
    setToken('tok')
    await show(overview('pro', { subscription: subscription(), options: { canUpgradeTo: ['premium'], canManage: true, needsPaymentFix: false } }))
    mockApi({ 'POST /billing/portal': [502, { message: 'Stripe is temporarily unavailable' }] })
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Manage subscription, payment method and invoices' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/Stripe is temporarily unavailable/)
  })
})

describe('Billing tab: loading and errors', () => {
  test('shows the loading text, then an error when the overview cannot be loaded', async () => {
    await show({ message: 'Unauthorized' }, 401)
    expect(screen.getByText('Loading…')).toBeTruthy()
    expect((await screen.findByRole('alert')).textContent).toMatch(/Unauthorized/)
  })
})
