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
