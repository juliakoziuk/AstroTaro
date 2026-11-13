// Реєстр екранів: порядок = «потік» користувача (його ж показує перемикач екранів). Лендінг і логін — окремі React-компоненти;
// решта — сторінки застосунку в одному стилі (AppPage.jsx, page.css): `Page` — компонент екрана.
import AstrologyPage from './pages/AstrologyPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { Analysis, Dreams } from './pages/DreamsPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ReadingPage from './pages/ReadingPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import TarotStudio from './pages/TarotStudio.jsx'
import SettingsPage from './SettingsPage.jsx'

const page = (id, path, name, Page) => ({ path, id, kind: 'page', name, title: name, bg: '#08121f', Page })

export const SCREENS = [
  { path: '/', id: 'landing', kind: 'landing', name: 'Landing', title: 'Discover your inner universe', bg: '#0c182a' },
  { path: '/login', id: 'login', kind: 'login', name: 'Login', title: 'Sign in', bg: '#0a1626' },
  { path: '/forgot-password', id: 'forgot-password', kind: 'account', name: 'Forgot password', title: 'Reset your password', bg: '#0a1626' },
  { path: '/reset-password', id: 'reset-password', kind: 'account', name: 'New password', title: 'Choose a new password', bg: '#0a1626' },
  { path: '/verify-email', id: 'verify-email', kind: 'account', name: 'Confirm email', title: 'Confirm your email', bg: '#0a1626' },
  { path: '/shared', id: 'shared', kind: 'account', name: 'Shared reading', title: 'A reading shared with you', bg: '#0a1626' },
  { path: '/onboarding', id: 'onboarding', kind: 'onboarding', name: 'Welcome', title: 'Welcome to MYSTIQ', bg: '#0a1626' },
  { path: '/today', id: 'today', kind: 'today', name: 'Cosmic Today', title: 'Cosmic Today', bg: '#0a1626' },
  { path: '/history', id: 'history', kind: 'history', name: 'Reading history', title: 'Reading history', bg: '#0a1626' },
  { path: '/draw', id: 'draw', kind: 'draw', name: 'Draw your cards', title: 'Draw your cards', bg: '#0a1626' },
  { path: '/daily', id: 'daily', kind: 'daily', name: 'Card of the day', title: 'Card of the day', bg: '#0a1626' },
  page('register', '/register', 'Create your account', RegisterPage),
  page('pricing', '/pricing', 'Choose your plan', PricingPage),
  page('dashboard', '/dashboard', 'Dashboard', Dashboard),
  page('tarot', '/tarot', 'Tarot Studio', TarotStudio),
  page('reading', '/reading', 'Tarot Reading', ReadingPage),
  page('dreams', '/dreams', 'Dream Journal', Dreams),
  page('analysis', '/analysis', 'Dream Analysis', Analysis),
  page('astrology', '/astrology', 'Astrology', AstrologyPage),
  page('profile', '/profile', 'Profile', ProfilePage),
  page('settings', '/settings', 'Settings', SettingsPage),
]

export const BY_PATH = Object.fromEntries(SCREENS.map((s) => [s.path, s]))
