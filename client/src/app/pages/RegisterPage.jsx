import { useState } from 'react'
import { register } from '../../lib/auth.js'
import { t, useLang } from '../../i18n/index.js'
import { saveCurrentLanguage } from '../../i18n/sync.js'
import AppPage from '../AppPage.jsx'
import { go, navProps } from '../router.js'

/** Реєстрація: імʼя, пошта, пароль двічі й згода з умовами; після створення акаунта мова, обрана тут, стає мовою акаунта. */
export default function RegisterPage() {
  useLang()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const [name, email, password] = [String(f.get('fullname')).trim(), String(f.get('email')).trim(), String(f.get('password'))]
    setError('')
    if (!name || !email || !password) return setError(t('Fill in your name, email and password'))
    if (password !== String(f.get('confirm'))) return setError(t('Passwords do not match'))
    if (!f.get('terms')) return setError(t('You need to agree to the terms'))
    setBusy(true)
    try {
      await register(name, email, password)
      await saveCurrentLanguage() // мова, обрана на сторінці реєстрації, стає мовою акаунта
      go('/dashboard')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AppPage guest title={t('Create your account')} subtitle={t('Join MYSTIQ and start your journey')}>
      <form className="ap-panel ap-form" onSubmit={submit} noValidate>
        <label className="ap-field">{t('Full name')}<input name="fullname" autoComplete="name" /></label>
        <label className="ap-field">{t('Email address')}<input name="email" type="email" autoComplete="email" /></label>
        <label className="ap-field">{t('Password')}<input name="password" type="password" autoComplete="new-password" /></label>
        <label className="ap-field">{t('Confirm password')}<input name="confirm" type="password" autoComplete="new-password" /></label>
        <label className="ap-check"><input name="terms" type="checkbox" />
          <span>{t('I agree to the')} {t('Terms of Service')} {t('and')} {t('Privacy Policy')}</span>
        </label>
        {error && <p className="ap-error" role="alert">{error}</p>}
        <button type="submit" className="ap-btn primary wide" disabled={busy}>{t('Create Account')}</button>
        <p className="ap-note" style={{ textAlign: 'center' }}>{t('Already have an account?')} <a className="ap-linkish" {...navProps('/login')}>{t('Sign In')}</a></p>
      </form>
    </AppPage>
  )
}
