import { useEffect } from 'react'
import { getToken, setUnauthorizedHandler } from '../lib/api.js'
import '../lib/theme.js' // ставить data-theme на <html> до першого малюнка
import './base.css'
import './theme.css'
import Landing from '../landing/Landing.jsx'
import Login from '../login/Login.jsx'
import { ForgotPassword, ResetPassword, VerifyEmail } from '../login/AccountPages.jsx'
import Shell from './Shell.jsx'
import SharedReading from './SharedReading.jsx'
import SettingsPage from './SettingsPage.jsx'
import InsightReminder from './InsightReminder.jsx'
import Proto from './Proto.jsx'
import Today from './Today.jsx'
import Draw from './Draw.jsx'
import Daily from './Daily.jsx'
import History from './History.jsx'
import Onboarding from './Onboarding.jsx'
import { useOnboarded } from './onboardingGate.js'
import { BY_PATH } from './screens.js'
import { go, useRoute } from './router.js'
import { useToast } from './toast.js'
import LangSwitch from '../i18n/LangSwitch.jsx'
import { t, useLang } from '../i18n/index.js'
import { applyServerLanguage } from '../i18n/sync.js'
import { useTheme } from '../lib/theme.js'
import { applyServerTheme } from '../lib/themeSync.js'

// Один React-застосунок для всіх 13 екранів: лендінг, логін і 11 екранів за макетами. Перехід між ними — клієнтський
// (hash-роутер, без перезавантаження); невідомий шлях веде на лендінг.
// Без входу доступні лише ці екрани; решта веде на логін
const PUBLIC = new Set(['/', '/login', '/register', '/pricing', '/forgot-password', '/reset-password', '/verify-email', '/shared'])
// Перемикач мови потрібен там, де людина ще не може зайти в налаштування
const BEFORE_LOGIN = new Set(['landing', 'login', 'register', 'forgot-password', 'reset-password', 'verify-email', 'shared'])
// Екрани входу: залогінений користувач (є дійсний токен) одразу потрапляє на дашборд; лендінг лишається, але показує його акаунт
const GUEST_ONLY = new Set(['login', 'register'])
const THEMED = new Set(['app', 'today', 'draw', 'daily', 'history'])
const LIGHT_BG = '#f3f0e7'
setUnauthorizedHandler(() => go('/login', { replace: true }))

export default function App() {
  const route = useRoute()
  const screen = BY_PATH[route] ?? BY_PATH['/']
  const toast = useToast()
  const lang = useLang()
  const theme = useTheme()
  const locked = !PUBLIC.has(screen.path) && !getToken()
  const signedInGuest = GUEST_ONLY.has(screen.id) && !!getToken()
  // Новий акаунт спершу веде на знайомство. Доки сервер не відповів, екрани застосунку не малюємо, щоб дашборд не блимнув перед переходом.
  const onboarded = useOnboarded()
  const inApp = !locked && !signedInGuest && !PUBLIC.has(screen.path) && screen.id !== 'onboarding'
  const toOnboarding = inApp && onboarded === false
  const showApp = inApp && onboarded === true

  useEffect(() => {
    if (locked) go('/login', { replace: true })
  }, [locked])

  useEffect(() => {
    if (signedInGuest) go('/dashboard', { replace: true })
  }, [signedInGuest])

  useEffect(() => {
    if (toOnboarding) go('/onboarding', { replace: true })
  }, [toOnboarding])

  // залогінений користувач: мова й тема з його налаштувань на сервері
  useEffect(() => {
    if (getToken()) {
      applyServerLanguage().catch(() => {})
      applyServerTheme().catch(() => {})
    }
  }, [])

  useEffect(() => {
    document.title = `MYSTIQ — ${t(screen.title)}`
    // світлу тему мають екрани застосунку; лендінг і вхід лишаються темними
    const bg = theme === 'light' && THEMED.has(screen.kind) ? LIGHT_BG : screen.bg
    document.documentElement.style.backgroundColor = bg
    document.body.style.backgroundColor = bg
    window.scrollTo(0, 0)
  }, [screen, lang, theme])

  return (
    <>
      <div className="route" key={screen.path}>
        {!locked && !signedInGuest && screen.kind === 'landing' && <Landing />}
        {!locked && !signedInGuest && screen.kind === 'login' && <Login />}
        {screen.id === 'forgot-password' && <ForgotPassword />}
        {screen.id === 'reset-password' && <ResetPassword />}
        {screen.id === 'verify-email' && <VerifyEmail />}
        {screen.id === 'shared' && <SharedReading />}
        {!locked && screen.kind === 'onboarding' && <Onboarding />}
        {showApp && screen.kind === 'today' && <Today />}
        {showApp && screen.kind === 'draw' && <Draw />}
        {showApp && screen.kind === 'daily' && <Daily />}
        {showApp && screen.kind === 'history' && <History />}
        {showApp && screen.kind === 'app' && (screen.id === 'settings' ? <SettingsPage /> : <Shell d={screen.data} live={screen.live} />)}
      </div>
      {BEFORE_LOGIN.has(screen.id) && <LangSwitch />}
      <Proto />
      {!locked && <InsightReminder route={route} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  )
}
