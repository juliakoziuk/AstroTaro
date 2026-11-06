import { useState } from 'react'
import './login.css'
import { useMediaQuery } from '../lib/useMediaQuery.js'
import { go, navProps } from '../app/router.js'
import googleG from './art/google-g.svg'
import { login } from '../lib/auth.js'
import { t, useLang } from '../i18n/index.js'
import { applyServerLanguage } from '../i18n/sync.js'
import { applyServerTheme } from '../lib/themeSync.js'

// Усі позиції — в «одиницях референсу» (1535x1024), див. login.css. zone = [x, y, w, h] ділянки референсу,
// з якої трасований вектор (scripts/build-login.mjs).
const ink = import.meta.glob('./art/ink/*.svg', { eager: true, query: '?url', import: 'default' })
const INK = (name) => ink[`./art/ink/${name}.svg`]
const srcset = (files, base) =>
  Object.entries(files)
    .map(([file, url]) => [base * Number(file.match(/-(\d+)x\./)[1]), url])
    .sort((a, b) => a[0] - b[0])
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ')
const plates = import.meta.glob('./art/plate-*x.webp', { eager: true, query: '?url', import: 'default' })
const cards = import.meta.glob('./art/card-*x.webp', { eager: true, query: '?url', import: 'default' })
const PLATE_SET = srcset(plates, 1535)
const CARD_SET = srcset(cards, 649)
const first = (set) => set.split(' ')[0]

const NARROW_QUERY = '(max-width: 720px), (max-aspect-ratio: 1 / 1)'
// ширина плити на екрані = min(100vw, 100vh * 1535/1024); спрайт картки = 649/1535 від неї
const PLATE_SIZES = 'min(100vw, calc(100vh * 1535 / 1024))'
// збільшені частини арту беруть 2x-плиту навіть на широких екранах
const ZOOM_SIZES = '3070px'
const CARD_SIZES = 'calc(min(100vw, 100vh * 1535 / 1024) * 649 / 1535)'

// cy — центр пункту, zone — ділянка значка в референсі (збігається з INK у scripts/login/config.mjs)
// href — маршрути застосунку (hash-роутер, src/app/router.js)
const NAV = [
  { id: 'home', label: 'Home', cy: 259.5, zone: [70, 240, 44, 38], active: true, href: '/dashboard' },
  { id: 'chat', label: 'Chat', cy: 337, zone: [70, 318, 44, 38], href: '/companion' },
  { id: 'analytics', label: 'Analytics', cy: 406, zone: [70, 386, 44, 38], href: '/analysis' },
  { id: 'access', label: 'Access', cy: 474.5, zone: [70, 454, 44, 42], href: '/pricing' },
  { id: 'settings', label: 'Settings', cy: 543, zone: [70, 522, 44, 42], href: '/settings' },
  { id: 'help', label: 'Help', cy: 611, zone: [70, 590, 44, 42], href: '/settings' },
]

// позиція «чорнильного» елемента (ліво/верх/розмір у одиницях)
const at = ([x, y, w, h]) => ({ '--x': x, '--y': y, '--w': w, '--h': h })

function Ink({ name, zone, className = '', origin = [0, 0] }) {
  const [x, y, w, h] = zone
  return (
    <img
      className={`ink ${className}`}
      src={INK(name)}
      alt=""
      aria-hidden="true"
      draggable="false"
      style={at([x - origin[0], y - origin[1], w, h])}
    />
  )
}

export default function Login() {
  useLang() // перемальовуємо при зміні мови
  const narrow = useMediaQuery(NARROW_QUERY)
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await login(String(f.get('email')).trim(), String(f.get('password')), remember)
      await applyServerLanguage().catch(() => {}) // мова акаунта важливіша за локальну
      await applyServerTheme().catch(() => {}) // і тема теж
      go('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  const CARD = [600, 62] // початок координат картки в референсі

  return (
    <div className="v-login">
    <main className="page">
      <div className="stage">
        {!narrow && (
          // арт з однієї плити: бічна панель | ліва частина (на широких екранах збільшується до картки) | центр | права частина
          <div className="art" aria-hidden="true">
            {['side', 'left', 'mid', 'right'].map((part) => (
              <div className={`art-${part}`} key={part}>
                <img src={first(PLATE_SET)} srcSet={PLATE_SET} sizes={part === 'left' || part === 'right' ? ZOOM_SIZES : PLATE_SIZES} width="1535" height="1024" alt="" draggable="false" decoding="async" fetchPriority="high" />
              </div>
            ))}
          </div>
        )}
        {narrow && <div className="art-flat" aria-hidden="true" />}

        {/* ---------- бічна панель ---------- */}
        <aside className="sidebar" aria-label={t('Navigation')}>
          <Ink name="sb-crest" zone={[80, 34, 120, 88]} />
          <div className="t sb-word">MYSTIQ</div>

          <span className="nav-pill" aria-hidden="true" />
          <nav className="nav">
            {NAV.map(({ id, label, cy, zone, active, href }) => (
              <a className={`nav-item${active ? ' is-active' : ''}`} {...navProps(href)} key={id} style={{ '--cy': cy }} aria-current={active ? 'page' : undefined}>
                <Ink name={`sb-${id}`} zone={zone} className="nav-icon" origin={[46, cy - 33]} />
                <span className="t nav-label">{t(label)}</span>
              </a>
            ))}
          </nav>

          <Ink name="sb-divider" zone={[84, 824, 126, 26]} />
          <button className="theme" type="button" aria-label={t('Toggle theme')}>
            <Ink name="sb-sun" zone={[74, 864, 36, 34]} origin={[63, 858]} />
            <i className="theme-knob" />
            <Ink name="sb-moon" zone={[168, 864, 32, 32]} origin={[63, 858]} />
          </button>
        </aside>

        {/* ---------- картка входу ---------- */}
        <section className="card" aria-label={t('Sign in')}>
          <img
            className="card-skin"
            src={first(CARD_SET)}
            srcSet={CARD_SET}
            sizes={CARD_SIZES}
            width="649"
            height="862"
            alt=""
            aria-hidden="true"
            draggable="false"
          />
          <Ink name="card-crest" zone={[768, 18, 318, 170]} origin={CARD} />
          <div className="t card-word">MYSTIQ</div>
          <Ink name="card-divider" zone={[694, 238, 462, 36]} origin={CARD} />
          <h1 className="t welcome">{t('Welcome back!')}</h1>
          <p className="t subtitle">{t('Sign in to continue your journey')}</p>

          <form onSubmit={submit} noValidate>
            <label className="field field-email">
              <Ink name="card-email" zone={[676, 436, 44, 34]} origin={[657, 419]} />
              <input className="t input" type="email" name="email" placeholder={t('Email address')} aria-label={t('Email address')} autoComplete="email" />
            </label>
            <label className="field field-pass">
              <Ink name="card-lock" zone={[678, 516, 40, 42]} origin={[657, 504]} />
              <input className="t input" type={show ? 'text' : 'password'} name="password" placeholder={t('Password')} aria-label={t('Password')} autoComplete="current-password" />
              <button className="eye" type="button" aria-label={show ? t('Hide password') : t('Show password')} aria-pressed={show} onClick={() => setShow((v) => !v)}>
                <Ink name="card-eye" zone={[1132, 522, 46, 34]} origin={[1132, 522]} />
              </button>
            </label>

            <label className="remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="box" aria-hidden="true" />
              <span className="t remember-text">{t('Remember me')}</span>
            </label>
            {/* екрана відновлення пароля в макетах немає: посилання без переходу */}
            <a className="t forgot" role="link" aria-disabled="true" tabIndex={-1}>{t('Forgot password?')}</a>

            {error && <p className="t form-error" role="alert">{error}</p>}

            <button className="btn-sign" type="submit" disabled={busy}>
              <Ink name="card-signstar" zone={[858, 662, 32, 44]} origin={[656, 651]} />
              <span className="t btn-text">{t('Sign In')}</span>
            </button>

            <div className="or" aria-hidden="true">
              <i className="or-line or-line-l" />
              <span className="t or-text">{t('or')}</span>
              <i className="or-line or-line-r" />
            </div>

            <button className="btn-google" type="button" onClick={() => go('/dashboard')}>
              <img className="g" src={googleG} alt="" aria-hidden="true" draggable="false" />
              <span className="t btn-text">{t('Continue with Google')}</span>
            </button>
          </form>

          <p className="footer">
            <span className="t foot-text">{t('Don’t have an account?')}</span>
            <a className="t foot-link" {...navProps('/register')}>{t('Sign Up')}</a>
          </p>
        </section>
      </div>
    </main>
    </div>
  )
}
