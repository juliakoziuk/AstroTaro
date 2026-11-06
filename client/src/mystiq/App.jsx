import { MystiqProvider } from './store.jsx'
import { AuthProvider } from './auth.jsx'
import { useAuth } from './authCore.js'
import { useMystiq } from './storeCore.js'
import { useEffect } from 'react'
import MoonPhase from './MoonPhase.jsx'
import { Icon } from './Icons.jsx'
import { go, useHashRoute } from './useHashRoute.js'
import { moonInfo } from './astro.js'
import { TODAY } from './dates.js'
import Dashboard from './pages/Dashboard.jsx'
import TarotStudio from './pages/TarotStudio.jsx'
import DreamJournal from './pages/DreamJournal.jsx'
import Astrology from './pages/Astrology.jsx'
import InnerJournal from './pages/InnerJournal.jsx'
import Companion from './pages/Companion.jsx'
import History from './pages/History.jsx'
import Reading from './pages/Reading.jsx'
import Analysis from './pages/Analysis.jsx'
import { Market, Profile, Notifications, Admin, Compatibility, Library } from './pages/More.jsx'
import { PublicShell, Landing, Login, Register, Pricing } from './pages/Public.jsx'

// Сторінки до входу: окремий каркас без бічної панелі
const PUBLIC = { landing: Landing, login: Login, register: Register, pricing: Pricing }

// nav: true — пункт бічного меню; parent — який пункт підсвічувати для вкладених сторінок
const ROUTES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', Page: Dashboard, nav: true },
  { id: 'tarot', label: 'Tarot Studio', icon: 'tarot', Page: TarotStudio, nav: true },
  { id: 'reading', label: 'Tarot Reading', icon: 'tarot', Page: Reading, nav: true },
  { id: 'dreams', label: 'Dream Journal', icon: 'dreams', Page: DreamJournal, nav: true },
  { id: 'analysis', label: 'Dream Analysis', icon: 'dreams', Page: Analysis, nav: true },
  { id: 'astrology', label: 'Astrology', icon: 'astrology', Page: Astrology, nav: true },
  { id: 'compatibility', label: 'Compatibility', icon: 'astrology', Page: Compatibility, nav: true },
  { id: 'journal', label: 'Inner Journal', icon: 'journal', Page: InnerJournal, nav: true },
  { id: 'companion', label: 'AI Companion', icon: 'companion', Page: Companion, nav: true },
  { id: 'history', label: 'My History', icon: 'history', Page: History, nav: true },
  { id: 'market', label: 'Mystic Market', icon: 'market', Page: Market, nav: true },
  { id: 'library', label: 'My Library', icon: 'journal', Page: Library, nav: true },
  { id: 'profile', label: 'Profile & Settings', icon: 'user', Page: Profile, nav: true },
  { id: 'notifications', label: 'Notifications', icon: 'bell', Page: Notifications, nav: true },
  { id: 'admin', label: 'Admin Panel', icon: 'shield', Page: Admin, nav: true },
]

const SUB = [
  { id: 'pricing', label: 'Pricing', icon: 'market' },
  { id: 'login', label: 'Login', icon: 'user' },
  { id: 'landing', label: 'Landing Page', icon: 'logout' },
]

const moon = moonInfo(TODAY)

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}

function Router() {
  const { user, checking, logout } = useAuth()
  const route = useHashRoute()
  const [base, param] = route.split('/')

  // Редірект робимо в ефекті, а не під час рендеру
  const guest = !user && !PUBLIC[base]
  const authed = !!user && (base === 'login' || base === 'register')
  useEffect(() => {
    if (checking) return
    if (guest) go('login')
    else if (authed) go('dashboard')
  }, [checking, guest, authed])

  if (checking || guest || authed) return null

  if (PUBLIC[base]) {
    const Page = PUBLIC[base]
    return (
      <PublicShell route={base}>
        <div key={base} className="mq-page">
          <Page />
        </div>
      </PublicShell>
    )
  }

  const room = ROUTES.find((r) => r.id === base) ?? ROUTES[0]
  const active = room.id

  return (
    <MystiqProvider>
      <div className="mq-app" data-room={active}>
        <aside className="mq-rail">
          <a className="mq-logo" href="#/landing" aria-label="MYSTIQ — головна">
            <span className="mq-logo-mark" aria-hidden="true" />
            Mystiq
          </a>
          <div className="p-navlabel">Твій всесвіт</div>
          <nav aria-label="Розділи">
            <ul className="mq-nav">
              {ROUTES.filter((r) => r.nav).map((r) => (
                <li key={r.id}>
                  <a href={`#/${r.id}`} className={r.id === active ? 'is-active' : ''} aria-current={r.id === active ? 'page' : undefined}>
                    <Icon name={r.icon} size={18} />
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="mq-nav mq-nav--sub">
            {SUB.map((s) => (
              <li key={s.id}>
                <a href={`#/${s.id}`} className={s.id === room.id ? 'is-active' : ''}>
                  <Icon name={s.icon} size={16} />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className="mq-btn mq-block mq-logout" onClick={() => { logout(); go('landing') }}>
            Вийти
          </button>
          <div className="mq-rail-moon">
            <MoonPhase date={TODAY} size={56} />
            <div>
              <strong>{moon.name}</strong>
              <span>освітлено {Math.round(moon.illumination * 100)} %</span>
            </div>
          </div>
        </aside>
        <div className="mq-col">
          <div className="mq-top">
            <div className="mq-top-left">
              <label className="mq-search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input placeholder="Пошук…" aria-label="Пошук" />
              </label>
              <span className="mq-top-title">MYSTIQ / {room.label.toUpperCase()}</span>
            </div>
            <div className="mq-top-tools">
              <div className="mq-hello">
                <strong>Привіт, {user.name}</strong>
                <span>Твій особистий всесвіт</span>
              </div>
              <a className="mq-bell" href="#/notifications" aria-label="Сповіщення">
                <Icon name="bell" size={17} />
                <span />
              </a>
              <a className="mq-avatar" href="#/profile" aria-label="Профіль">{user.name.slice(0, 1).toUpperCase()}</a>
            </div>
          </div>
          <main className="mq-main">
            <ErrorBanner />
            <div key={route} className="mq-page">
              <room.Page param={param} />
            </div>
          </main>
        </div>
      </div>
    </MystiqProvider>
  )
}

function ErrorBanner() {
  const { error, clearError } = useMystiq()
  if (!error) return null
  return (
    <div className="mq-error" role="alert">
      {error}
      <button type="button" onClick={clearError} aria-label="Закрити">×</button>
    </div>
  )
}
