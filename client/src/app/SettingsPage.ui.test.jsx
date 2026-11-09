import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from './SettingsPage.jsx'
import { setToken } from '../lib/api.js'
import { mockApi } from '../test/setup.js'

const SETTINGS = { notifications: true, insights: true, autosave: true, companion: true, language: 'English', theme: 'Dark', defaultReading: 'Tarot', timeFormat: '24-hour', dateFormat: 'DD/MM/YYYY' }
const BILLING = {
  plan: 'free', planName: 'Free', price: 0, interval: 'month', subscription: null,
  limits: { readingsPerMonth: 5, dreamsTotal: 10, aiMessagesPerDay: 10, readingModes: ['quick'], compatibility: false, forecastRanges: ['day'], fullReports: false },
  usage: { readingsThisMonth: 1, dreamsTotal: 0, aiMessagesToday: 0 }, remaining: { readings: 4, dreams: 10, aiMessages: 10 },
  resets: { readings: '2026-12-01T00:00:00.000Z', aiMessages: '2026-11-10T00:00:00.000Z' },
  options: { canUpgradeTo: ['pro', 'premium'], canManage: false, needsPaymentFix: false },
}
const open = () => {
  setToken('tok')
  mockApi({ 'GET /settings': [200, SETTINGS], 'GET /auth/me': [200, { consent: { dreams: false, journal: false, spreads: false } }], 'GET /billing': [200, BILLING] })
  render(<SettingsPage />)
}

describe('settings tabs', () => {
  test('Billing sits before About and every other tab keeps its place', async () => {
    open()
    const names = (await screen.findAllByRole('tab')).map((tab) => tab.textContent)
    expect(names).toEqual(['General', 'Notifications', 'Appearance', 'Language', 'Privacy & Security', 'Data & Storage', 'Billing', 'About'])
  })

  test('the Billing tab shows the billing overview', async () => {
    open()
    await userEvent.setup().click(await screen.findByRole('tab', { name: 'Billing' }))
    expect(await screen.findByRole('heading', { name: 'Usage' })).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Readings this month' })).toBeTruthy()
  })

  test('the About tab still shows About (its number moved when Billing was added)', async () => {
    open()
    await userEvent.setup().click(await screen.findByRole('tab', { name: 'About' }))
    expect(await screen.findByText('Tarot, dream journaling, astrology and an AI Companion in one space.')).toBeTruthy()
  })

  test('the other tabs still show their own content', async () => {
    open()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('tab', { name: 'Data & Storage' }))
    expect(await screen.findByRole('button', { name: 'Export my data (JSON)' })).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'General' }))
    expect(await screen.findByText('Core app preferences')).toBeTruthy()
  })
})
