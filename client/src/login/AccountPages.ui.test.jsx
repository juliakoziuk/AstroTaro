import { describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPassword, ResetPassword, VerifyEmail } from './AccountPages.jsx'
import { mockApi } from '../test/setup.js'

const TOKEN = 'a'.repeat(43)

describe('forgot password', () => {
  test('sends the email and shows the same neutral message', async () => {
    const calls = mockApi({ 'POST /auth/forgot-password': [201, { ok: true }] })
    const user = userEvent.setup()
    render(<ForgotPassword />)
    await user.type(screen.getByLabelText('Email address'), ' a@b.co ')
    await user.click(screen.getByRole('button', { name: 'Send the link' }))
    expect((await screen.findByRole('status')).textContent).toMatch(/If an account with this email exists/)
    expect(calls[0].body).toEqual({ email: 'a@b.co' })
    expect(screen.getByRole('link', { name: 'Back to sign in' }).getAttribute('href')).toBe('#/login')
  })

  test('a server refusal (for example the request limit) is shown', async () => {
    mockApi({ 'POST /auth/forgot-password': [429, { message: 'Too many attempts. Try again in 60 min.' }] })
    const user = userEvent.setup()
    render(<ForgotPassword />)
    await user.type(screen.getByLabelText('Email address'), 'a@b.co')
    await user.click(screen.getByRole('button', { name: 'Send the link' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/Too many attempts/)
  })
})

describe('reset password', () => {
  const open = () => {
    window.location.hash = `#/reset-password?token=${TOKEN}`
  }

  test('without a token in the link it explains and offers a new link', () => {
    window.location.hash = '#/reset-password'
    mockApi({})
    render(<ResetPassword />)
    expect(screen.getByRole('alert').textContent).toMatch(/no token/)
    expect(screen.getByRole('link', { name: 'Request a new link' }).getAttribute('href')).toBe('#/forgot-password')
  })

  test('checks the password locally before calling the server', async () => {
    open()
    const calls = mockApi({})
    const user = userEvent.setup()
    render(<ResetPassword />)
    await user.type(screen.getByLabelText('New password'), 'short')
    await user.type(screen.getByLabelText('Repeat the password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Save the password' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/at least 8/)
    await user.clear(screen.getByLabelText('New password'))
    await user.type(screen.getByLabelText('New password'), 'long enough password')
    await user.click(screen.getByRole('button', { name: 'Save the password' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/do not match/)
    expect(calls).toHaveLength(0)
  })

  test('sends the token with the new password, then leads to sign-in', async () => {
    open()
    const calls = mockApi({ 'POST /auth/reset-password': [201, { ok: true }] })
    const user = userEvent.setup()
    render(<ResetPassword />)
    await user.type(screen.getByLabelText('New password'), 'long enough password')
    await user.type(screen.getByLabelText('Repeat the password'), 'long enough password')
    await user.click(screen.getByRole('button', { name: 'Save the password' }))
    expect((await screen.findByRole('status')).textContent).toMatch(/password has been changed/)
    expect(calls[0].body).toEqual({ token: TOKEN, password: 'long enough password' })
    expect(screen.getByRole('link', { name: 'Sign In' }).getAttribute('href')).toBe('#/login')
  })

  test('an expired link shows the server message', async () => {
    open()
    mockApi({ 'POST /auth/reset-password': [400, { message: 'This link is invalid or has expired. Request a new one.' }] })
    const user = userEvent.setup()
    render(<ResetPassword />)
    await user.type(screen.getByLabelText('New password'), 'long enough password')
    await user.type(screen.getByLabelText('Repeat the password'), 'long enough password')
    await user.click(screen.getByRole('button', { name: 'Save the password' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/invalid or has expired/)
  })
})

describe('confirm email', () => {
  test('confirms by itself when opened from the email', async () => {
    window.location.hash = `#/verify-email?token=${TOKEN}`
    const calls = mockApi({ 'POST /auth/verify-email': [201, { emailVerified: true }] })
    render(<VerifyEmail />)
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/email is confirmed/))
    expect(calls[0].body).toEqual({ token: TOKEN })
    expect(screen.getByRole('link', { name: 'Go to dashboard' }).getAttribute('href')).toBe('#/dashboard')
  })

  test('a used or expired link says so', async () => {
    window.location.hash = `#/verify-email?token=${TOKEN}`
    mockApi({ 'POST /auth/verify-email': [400, { message: 'This link is invalid or has expired. Request a new one.' }] })
    render(<VerifyEmail />)
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/invalid or has expired/))
  })
})
