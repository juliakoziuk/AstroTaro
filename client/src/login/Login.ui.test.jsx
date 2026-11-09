import { describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './Login.jsx'
import { getToken } from '../lib/auth.js'
import { mockApi } from '../test/setup.js'

const fill = async (user, email, password) => {
  await user.type(screen.getByLabelText('Email address'), email)
  await user.type(screen.getByLabelText('Password'), password)
}
const signIn = (user) => user.click(screen.getByRole('button', { name: 'Sign In' }))

describe('sign in', () => {
  test('a wrong password shows the server message, keeps the person on the form and stores no token', async () => {
    const calls = mockApi({ 'POST /auth/login': [401, { message: 'Invalid email or password' }] })
    const user = userEvent.setup()
    render(<Login />)
    await fill(user, 'a@b.co', 'wrong-password')
    await signIn(user)
    expect((await screen.findByRole('alert')).textContent).toBe('Invalid email or password')
    expect(getToken()).toBeNull()
    expect(window.location.hash).not.toBe('#/dashboard')
    expect(calls.map((c) => c.key)).toEqual(['POST /auth/login'])
  })

  test('success stores the token, applies the account language and theme, and opens the dashboard', async () => {
    const calls = mockApi({
      'POST /auth/login': [201, { token: 'tok-1', user: { name: 'Юля' } }],
      'GET /settings': [200, { language: 'English', theme: 'Dark' }],
    })
    const user = userEvent.setup()
    render(<Login />)
    await fill(user, ' a@b.co ', 'correct horse')
    await signIn(user)
    await waitFor(() => expect(window.location.hash).toBe('#/dashboard'))
    expect(getToken()).toBe('tok-1')
    expect(calls[0].body).toEqual({ email: 'a@b.co', password: 'correct horse', remember: false }) // пошта без зайвих пробілів
    expect(calls.some((c) => c.key === 'GET /settings')).toBe(true)
  })

  test('without "Remember me" the token lives only as long as the tab', async () => {
    mockApi({ 'POST /auth/login': [201, { token: 'tok-2', user: {} }], 'GET /settings': [200, { language: 'English', theme: 'Dark' }] })
    const user = userEvent.setup()
    render(<Login />)
    await fill(user, 'a@b.co', 'correct horse')
    await signIn(user)
    await waitFor(() => expect(getToken()).toBe('tok-2'))
    expect(sessionStorage.length).toBe(1)
    expect(localStorage.length).toBe(0)
  })

  test('with "Remember me" the token is kept in localStorage and the request asks for a long session', async () => {
    const calls = mockApi({ 'POST /auth/login': [201, { token: 'tok-4', user: {} }], 'GET /settings': [200, { language: 'English', theme: 'Dark' }] })
    const user = userEvent.setup()
    render(<Login />)
    await fill(user, 'a@b.co', 'correct horse')
    await user.click(screen.getByRole('checkbox'))
    await signIn(user)
    await waitFor(() => expect(getToken()).toBe('tok-4'))
    expect(calls[0].body.remember).toBe(true)
    expect(localStorage.length).toBe(1)
    expect(sessionStorage.length).toBe(0)
  })

  test('the button is locked while the request runs, so a second click sends nothing', async () => {
    let release
    const pending = new Promise((resolve) => (release = resolve))
    const calls = mockApi({
      'POST /auth/login': () => pending, // відповідь «висить», поки тест її не відпустить
      'GET /settings': [200, { language: 'English', theme: 'Dark' }],
    })
    const user = userEvent.setup()
    render(<Login />)
    await fill(user, 'a@b.co', 'correct horse')
    const button = screen.getByRole('button', { name: 'Sign In' })
    await user.click(button)
    await user.click(button)
    expect(button.disabled).toBe(true)
    expect(calls.filter((c) => c.key === 'POST /auth/login')).toHaveLength(1)
    release([201, { token: 'tok-3', user: {} }])
    await waitFor(() => expect(window.location.hash).toBe('#/dashboard'))
    expect(calls.filter((c) => c.key === 'POST /auth/login')).toHaveLength(1)
  })

  test('a lockout answer (429) is shown as is', async () => {
    mockApi({ 'POST /auth/login': [429, { message: 'Too many attempts. Try again in 15 min.' }] })
    const user = userEvent.setup()
    render(<Login />)
    await fill(user, 'a@b.co', 'x'.repeat(10))
    await signIn(user)
    expect((await screen.findByRole('alert')).textContent).toMatch(/Too many attempts/)
  })

  test('the password field can be revealed', async () => {
    const user = userEvent.setup()
    render(<Login />)
    expect(screen.getByLabelText('Password').type).toBe('password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password').type).toBe('text')
  })
})
