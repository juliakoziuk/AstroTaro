import { useEffect, useState } from 'react'
import { get, getToken } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { initialOf } from './avatar.js'
import { navProps } from './router.js'
import NavLinks from './NavLinks.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import scene from './art/draw-scene.webp'
// порядок важливий: стилі панелі налаштувань (темні за замовчуванням) мають бути раніше, щоб settings-page.css переписав їх для обох тем
import './live/settings-panel.css'
import './settings-page.css'
import './page.css'

/** Кружечок з іменем унизу бічної панелі: веде на профіль. Гостю (тарифи без входу) не показується. */
function AccountChip() {
  useLang()
  const [name, setName] = useState('')
  const signedIn = !!getToken()
  useEffect(() => {
    if (!signedIn) return undefined
    let live = true
    get('/profile').then((p) => live && setName(p.name ?? ''), () => {}) // без імені лишається кружечок із зіркою
    return () => {
      live = false
    }
  }, [signedIn])
  if (!signedIn) return null
  return (
    <a className="settings-me" {...navProps('/profile')} aria-label={t('My profile')} title={t('My profile')}>
      <span className="avatar" aria-hidden="true">{initialOf(name) || '✦'}</span>
      <span className="who">
        <b>{name}</b>
        <small>{t('My profile')}</small>
      </span>
    </a>
  )
}

/**
 * Рамка всіх екранів застосунку, одна на всі: сцена-фон, бічна панель із меню, заголовок і вміст у кремових (світла тема)
 * чи темних (темна) панелях. Вигляд задає settings-page.css (змінні --settings-*) і page.css (вміст).
 * `back` — шлях, куди веде стрілка «назад» (back:/шлях повертає в попередній екран, якщо він є); без нього стрілки немає.
 */
export default function AppPage({ title, subtitle, back, children, onHelp, onTheme, themeDisabled, actions, guest = false, className = '' }) {
  useLang()
  // гостьовий екран (реєстрація): без бічної панелі, картка по центру
  if (guest) {
    return (
      <div className={`v-app settings-page ap-guest ${className}`} style={{ '--settings-scene': `url(${scene})` }}>
        <main className="settings-main">
          <a {...navProps('/')} className="settings-brand"><span aria-hidden="true">☾</span>MYSTIQ</a>
          <header className="settings-heading" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </header>
          {children}
        </main>
      </div>
    )
  }
  return (
    <div className={`v-app settings-page ${className}`} style={{ '--settings-scene': `url(${scene})` }}>
      <aside className="settings-sidebar">
        <a {...navProps('/dashboard')} className="settings-brand"><span aria-hidden="true">☾</span>MYSTIQ</a>
        <NavLinks activeClass="active" onHelp={onHelp} />
        <AccountChip />
        <ThemeToggle className="settings-theme-toggle" onChange={onTheme} disabled={themeDisabled} />
      </aside>
      <main className="settings-main">
        <header className="settings-heading">
          {back && <a {...navProps(back)} aria-label={t('Back')}>←</a>}
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="ap-heading-actions">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  )
}
