import { useEffect, useMemo } from 'react'
import { getToken, setUnauthorizedHandler } from '../lib/api.js'
import '../lib/theme.js' // ставить data-theme на <html> до першого малюнка
import './base.css'
import './theme.css'
import Landing from '../landing/Landing.jsx'
import Login from '../login/Login.jsx'
import { ForgotPassword, ResetPassword, VerifyEmail } from '../login/AccountPages.jsx'
import Shell from './Shell.jsx'
import SharedReading from './SharedReading.jsx'
import InsightReminder from './InsightReminder.jsx'
import Proto from './Proto.jsx'
import Today from './Today.jsx'
import Draw from './Draw.jsx'
import Daily from './Daily.jsx'
import History from './History.jsx'
import Onboarding from './Onboarding.jsx'
import { useOnboarded } from './onboardingGate.js'
import { BY_PATH, SCREENS } from './screens.js'
import { plateOf, useHeldScreen } from './heldScreen.js'
import { decodePlate, prefetchPlates } from './plate.js'
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
const THEMED = new Set(['app', 'page', 'today', 'draw', 'daily', 'history'])
const LIGHT_BG = '#eee8d9'
// Екрани застосунку мають два вигляди: темна тема — намальовані плити (Screen/Shell), світла — справжні сторінки (pages/*, AppPage).
const viewFor = (s, theme) => (s.Page && theme === 'light' ? { ...s, kind: 'page' } : s)
setUnauthorizedHandler(() => go('/login', { replace: true }))

export default function App() {
  const route = useRoute()
  const theme = useTheme()
  const raw = BY_PATH[route] ?? BY_PATH['/']
  const target = useMemo(() => viewFor(raw, theme), [raw, theme]) // куди йде людина: за цим працюють охорона маршрутів і переходи
  const screen = useHeldScreen(target) // що малюємо: між екранами з плитою лишається попередній, доки новий не готовий
  const holding = screen.path !== target.path
  const toast = useToast()
  const lang = useLang()
  const locked = !PUBLIC.has(target.path) && !getToken()
  const signedInGuest = GUEST_ONLY.has(target.id) && !!getToken()
  // Новий акаунт спершу веде на знайомство. Доки сервер не відповів, екрани застосунку не малюємо, щоб дашборд не блимнув перед переходом.
  const onboarded = useOnboarded()
  // inApp — екрани лише для залогінених: їх (і перехід на знайомство) тримає перевірка. Публічні намальовані екрани (Реєстрація, Тарифи)
  // теж «екрани застосунку», але гостю їх показуємо завжди, без запиту до сервера.
  const inApp = !locked && !signedInGuest && !PUBLIC.has(target.path) && target.id !== 'onboarding'
  const toOnboarding = inApp && onboarded === false
  const showApp = !locked && !signedInGuest && (!inApp || onboarded === true)
  const visible = showApp || holding // поки тримаємо попередній екран, його не ховаємо

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

  // Наступні екрани готуємо наперед, щоб вони з'являлись одразу: 1) після входу тихо вантажимо плити екранів бічного меню в кеш;
  // 2) на наведення й фокус на посилання на екран із плитою декодуємо її (до кліку зазвичай устигає).
  const signedIn = !!getToken()
  const plates = theme === 'dark' // плити потрібні лише темній темі
  useEffect(() => {
    if (!signedIn || !plates) return undefined
    let stop = () => {}
    const timer = setTimeout(() => {
      const ids = ['dashboard', 'tarot', 'dreams', 'astrology', 'analysis', 'profile', 'pricing', 'reading']
      stop = prefetchPlates(ids.map((id) => plateOf(SCREENS.find((x) => x.id === id) ?? {})))
    }, 2500)
    return () => {
      clearTimeout(timer)
      stop()
    }
  }, [signedIn, plates])

  useEffect(() => {
    if (!plates) return undefined
    const warm = (e) => {
      const link = e.target?.closest?.('a[href^="#/"]')
      if (!link) return
      const next = BY_PATH[link.getAttribute('href').slice(1).split('?')[0]]
      const url = next && plateOf(next)
      if (url) decodePlate(url)
    }
    document.addEventListener('pointerover', warm, { passive: true })
    document.addEventListener('focusin', warm)
    return () => {
      document.removeEventListener('pointerover', warm)
      document.removeEventListener('focusin', warm)
    }
  }, [plates])

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
        {visible && screen.kind === 'today' && <Today />}
        {visible && screen.kind === 'draw' && <Draw />}
        {visible && screen.kind === 'daily' && <Daily />}
        {visible && screen.kind === 'history' && <History />}
        {visible && screen.kind === 'app' && <Shell d={screen.data} live={screen.live} />}
        {visible && screen.kind === 'page' && <screen.Page />}
      </div>
      {BEFORE_LOGIN.has(screen.id) && <LangSwitch />}
      <Proto />
      {!locked && <InsightReminder route={route} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  )
}
