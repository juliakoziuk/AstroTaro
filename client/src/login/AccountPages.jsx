import { useEffect, useRef, useState } from 'react'
import './account.css'
import { hashParam, navProps } from '../app/router.js'
import { t, useLang } from '../i18n/index.js'
import { forgotPassword, resetPassword, verifyEmail } from '../lib/auth.js'

// Прості екрани акаунта: «Забули пароль», «Новий пароль», «Підтвердження пошти». Макетів для них немає,
// тому це проста картка в кольорах входу, а не «плита».

const MIN_PASSWORD = 8

function Card({ title, children }) {
  return (
    <div className="v-account">
      <main className="account-page">
        <section className="account-card" aria-labelledby="account-title">
          <div className="account-brand" aria-hidden="true">MYSTIQ</div>
          <h1 id="account-title">{title}</h1>
          {children}
        </section>
      </main>
    </div>
  )
}

export function ForgotPassword() {
  useLang()
  const [state, setState] = useState({ busy: false, sent: false, error: '' })
  const sending = useRef(false)

  const submit = async (e) => {
    e.preventDefault()
    if (sending.current) return
    sending.current = true
    const email = String(new FormData(e.currentTarget).get('email')).trim()
    setState({ busy: true, sent: false, error: '' })
    try {
      await forgotPassword(email)
      setState({ busy: false, sent: true, error: '' })
    } catch (err) {
      setState({ busy: false, sent: false, error: err.message })
    } finally {
      sending.current = false
    }
  }

  return (
    <Card title={t('Reset your password')}>
      {state.sent ? (
        <p className="account-note" role="status">{t('If an account with this email exists, a link has been sent. It is valid for one hour.')}</p>
      ) : (
        <form onSubmit={submit} noValidate>
          <p>{t('Enter the email of your account and we will send you a link to choose a new password.')}</p>
          <input type="email" name="email" placeholder={t('Email address')} aria-label={t('Email address')} autoComplete="email" required />
          {state.error && <p className="account-error" role="alert">{state.error}</p>}
          <button type="submit" disabled={state.busy}>{state.busy ? t('Sending…') : t('Send the link')}</button>
        </form>
      )}
      <a className="account-back" {...navProps('/login')}>{t('Back to sign in')}</a>
    </Card>
  )
}

export function ResetPassword() {
  useLang()
  const token = hashParam('token')
  const [state, setState] = useState({ busy: false, done: false, error: '' })
  const sending = useRef(false)

  const submit = async (e) => {
    e.preventDefault()
    if (sending.current) return
    const f = new FormData(e.currentTarget)
    const password = String(f.get('password'))
    if (password.length < MIN_PASSWORD) return setState({ busy: false, done: false, error: t('Password must be at least 8 characters') })
    if (password !== String(f.get('repeat'))) return setState({ busy: false, done: false, error: t('Passwords do not match') })
    sending.current = true
    setState({ busy: true, done: false, error: '' })
    try {
      await resetPassword(token, password)
      setState({ busy: false, done: true, error: '' })
    } catch (err) {
      setState({ busy: false, done: false, error: err.message })
    } finally {
      sending.current = false
    }
  }

  if (!token) {
    return (
      <Card title={t('Choose a new password')}>
        <p className="account-error" role="alert">{t('This link has no token. Open the link from the email again.')}</p>
        <a className="account-back" {...navProps('/forgot-password')}>{t('Request a new link')}</a>
      </Card>
    )
  }
  return (
    <Card title={t('Choose a new password')}>
      {state.done ? (
        <>
          <p className="account-note" role="status">{t('Your password has been changed. Sign in with the new one.')}</p>
          <a className="account-button" {...navProps('/login')}>{t('Sign In')}</a>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          <input type="password" name="password" placeholder={t('New password')} aria-label={t('New password')} autoComplete="new-password" />
          <input type="password" name="repeat" placeholder={t('Repeat the password')} aria-label={t('Repeat the password')} autoComplete="new-password" />
          {state.error && <p className="account-error" role="alert">{state.error}</p>}
          <button type="submit" disabled={state.busy}>{t('Save the password')}</button>
          <a className="account-back" {...navProps('/forgot-password')}>{t('Request a new link')}</a>
        </form>
      )}
    </Card>
  )
}

export function VerifyEmail() {
  useLang()
  const token = hashParam('token')
  const [state, setState] = useState(token ? { status: 'working', error: '' } : { status: 'failed', error: t('This link has no token. Open the link from the email again.') })
  useEffect(() => {
    if (!token) return
    let live = true
    verifyEmail(token).then(
      () => live && setState({ status: 'done', error: '' }),
      (err) => live && setState({ status: 'failed', error: err.message }),
    )
    return () => {
      live = false
    }
  }, [token])

  return (
    <Card title={t('Confirm your email')}>
      {state.status === 'working' && <p role="status">{t('Confirming your email…')}</p>}
      {state.status === 'done' && (
        <>
          <p className="account-note" role="status">{t('Your email is confirmed.')}</p>
          <a className="account-button" {...navProps('/dashboard')}>{t('Go to dashboard')}</a>
        </>
      )}
      {state.status === 'failed' && <p className="account-error" role="alert">{state.error}</p>}
    </Card>
  )
}
