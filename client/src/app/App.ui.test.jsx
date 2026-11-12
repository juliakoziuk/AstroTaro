import { describe, expect, test } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import App from './App.jsx'
import { setToken } from '../lib/api.js'
import { mockApi } from '../test/setup.js'

// Охорона маршрутів: що бачить гість, а що — той, хто вже увійшов
describe('route guard', () => {
  test.each(['/dashboard', '/dreams', '/tarot', '/astrology', '/profile', '/settings', '/history'])('a guest opening %s is sent to the sign-in screen', async (path) => {
    mockApi({})
    window.location.hash = `#${path}`
    render(<App />)
    await waitFor(() => expect(window.location.hash).toBe('#/login'))
  })

  test.each(['/', '/login', '/register', '/pricing'])('%s stays open for a guest', async (path) => {
    mockApi({})
    window.location.hash = `#${path}`
    render(<App />)
    await new Promise((r) => setTimeout(r, 50))
    expect(window.location.hash).toBe(`#${path}`)
  })

  test('a signed-in user opening the sign-in screen is sent to the dashboard', async () => {
    setToken('tok')
    mockApi({ 'GET /settings': [200, { language: 'English', theme: 'Dark' }] })
    window.location.hash = '#/login'
    render(<App />)
    await waitFor(() => expect(window.location.hash).toBe('#/dashboard'))
  })
})

// Знайомство після реєстрації: новий акаунт іде на нього з будь-якого екрана застосунку. Токени різні, бо відповідь сервера пам'ятається на токен.
describe('onboarding gate', () => {
  const me = (onboarded) => ({ 'GET /auth/me': [200, { id: 'u', onboarded, interests: [] }], 'GET /settings': [200, { language: 'English', theme: 'Dark' }] })

  test('an account that has not been through onboarding is sent to it from the dashboard', async () => {
    setToken('tok-new')
    mockApi(me(false))
    window.location.hash = '#/dashboard'
    render(<App />)
    await waitFor(() => expect(window.location.hash).toBe('#/onboarding'))
  })

  test('an account that has finished it stays where it is', async () => {
    setToken('tok-old')
    mockApi(me(true))
    window.location.hash = '#/history'
    render(<App />)
    await new Promise((r) => setTimeout(r, 80))
    expect(window.location.hash).toBe('#/history')
  })

  test('public screens are not redirected, and the question about onboarding is not asked for a guest', async () => {
    const calls = mockApi({})
    window.location.hash = '#/pricing'
    render(<App />)
    await new Promise((r) => setTimeout(r, 50))
    expect(window.location.hash).toBe('#/pricing')
    expect(calls.some((c) => c.key === 'GET /auth/me')).toBe(false)
  })
})
