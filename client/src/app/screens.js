// Реєстр екранів: порядок = «потік» користувача (його ж показує перемикач екранів). Лендінг і логін — окремі React-компоненти,
// решта — екрани за макетами з даних, які збирає scripts/app/build.mjs (src/app/data/*.json) і плит (src/app/art/*.webp).
import { LIVE } from './live/index.js'
import { bindTexts, limitByNeighbours, withoutNavTexts } from './resolve.js'

const data = import.meta.glob('./data/*.json', { eager: true, import: 'default' })
const plates = import.meta.glob('./art/*.webp', { eager: true, query: '?url', import: 'default' })

const APP_ORDER = ['register', 'pricing', 'dashboard', 'tarot', 'reading', 'dreams', 'analysis', 'astrology', 'profile', 'settings']
const byId = Object.fromEntries(Object.values(data).map((d) => [d.id, { ...d, plate: plates[`./art/${d.id}.webp`], plate2: plates[`./art/${d.id}-2x.webp`] }]))

export const SCREENS = [
  { path: '/', id: 'landing', kind: 'landing', name: 'Landing', title: 'Discover your inner universe', bg: '#0c182a' },
  { path: '/login', id: 'login', kind: 'login', name: 'Login', title: 'Sign in', bg: '#0a1626' },
  // тексти-дані екрана підміняються прив'язками до API (live/*.jsx); екран без запису в LIVE лишається статичним
  { path: '/forgot-password', id: 'forgot-password', kind: 'account', name: 'Forgot password', title: 'Reset your password', bg: '#0a1626' },
  { path: '/reset-password', id: 'reset-password', kind: 'account', name: 'New password', title: 'Choose a new password', bg: '#0a1626' },
  { path: '/verify-email', id: 'verify-email', kind: 'account', name: 'Confirm email', title: 'Confirm your email', bg: '#0a1626' },
  { path: '/shared', id: 'shared', kind: 'account', name: 'Shared reading', title: 'A reading shared with you', bg: '#0a1626' },
  { path: '/onboarding', id: 'onboarding', kind: 'onboarding', name: 'Welcome', title: 'Welcome to MYSTIQ', bg: '#0a1626' },
  { path: '/today', id: 'today', kind: 'today', name: 'Cosmic Today', title: 'Cosmic Today', bg: '#0a1626' },
  { path: '/history', id: 'history', kind: 'history', name: 'Reading history', title: 'Reading history', bg: '#0a1626' },
  { path: '/draw', id: 'draw', kind: 'draw', name: 'Draw your cards', title: 'Draw your cards', bg: '#0a1626' },
  { path: '/daily', id: 'daily', kind: 'daily', name: 'Card of the day', title: 'Card of the day', bg: '#0a1626' },
  ...APP_ORDER.map((id) => {
    const live = LIVE[id]
    const d = { ...byId[id], texts: withoutNavTexts(limitByNeighbours(live ? bindTexts(byId[id].texts, live.bind) : byId[id].texts, byId[id].hits), byId[id].hits) }
    return { path: d.route, id, kind: 'app', name: d.title, title: d.title, bg: '#0b1828', data: d, live }
  }),
]

export const BY_PATH = Object.fromEntries(SCREENS.map((s) => [s.path, s]))
