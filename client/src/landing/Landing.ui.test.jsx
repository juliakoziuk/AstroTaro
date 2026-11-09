import { describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Landing from './Landing.jsx'
import { getToken, setToken } from '../lib/api.js'
import { mockApi } from '../test/setup.js'

describe('landing page', () => {
  test('a guest is offered to get started or sign in, and sees no account chip', () => {
    mockApi({})
    render(<Landing />)
    expect(screen.getByRole('link', { name: 'Get started' }).getAttribute('href')).toBe('#/register')
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('#/login')
    expect(screen.queryByRole('link', { name: 'Profile' })).toBeNull()
  })

  test('the four features lead to their screens', () => {
    mockApi({})
    render(<Landing />)
    const nav = screen.getByRole('navigation', { name: 'MYSTIQ features' })
    const hrefs = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['#/tarot', '#/dreams', '#/astrology', '#/companion'])
  })

  test('a signed-in user sees their account chip, goes to the dashboard and can log out', async () => {
    setToken('tok-1')
    mockApi({ 'GET /auth/me': [200, { name: 'Юлічка', email: 'j@example.com' }] })
    const user = userEvent.setup()
    render(<Landing />)
    const chip = await screen.findByRole('link', { name: 'Profile' })
    expect(chip.textContent).toContain('Юлічка')
    expect(chip.textContent).toContain('Ю') // ініціали в аватарі
    expect(chip.getAttribute('href')).toBe('#/profile')
    expect(screen.getByRole('link', { name: 'Go to dashboard' }).getAttribute('href')).toBe('#/dashboard')

    await user.click(screen.getByRole('link', { name: 'Log Out' }))
    expect(getToken()).toBeNull()
    expect(await screen.findByRole('link', { name: 'Sign in' })).toBeTruthy()
  })

  test('if the token is rejected the chip does not appear, only the guest buttons stay usable', async () => {
    setToken('stale-token')
    mockApi({ 'GET /auth/me': [401, { message: 'Unauthorized' }] })
    render(<Landing />)
    await waitFor(() => expect(getToken()).toBeNull()) // 401 з токеном: клієнт виходить сам
    expect(screen.queryByRole('link', { name: 'Profile' })).toBeNull()
  })
})
