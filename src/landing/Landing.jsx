import { useSyncExternalStore } from 'react'
import './landing.css'
import { navProps } from '../app/router.js'
import { t, useLang } from '../i18n/index.js'
import traced from './art/traced/scene.svg'
import brandMoon from './art/traced/brand-moon.svg'
import tarot from './art/traced/icon-tarot.svg'
import dreams from './art/traced/icon-dreams.svg'
import astrology from './art/traced/icon-astrology.svg'
import assistant from './art/traced/icon-assistant.svg'

// Плита — пікселі референсу без тексту (scripts/build-plate.mjs): plate-1x/2x(/4x).webp → srcset за шириною.
const plates = import.meta.glob('./art/plate-*x.webp', { eager: true, query: '?url', import: 'default' })
const PLATE_SRCSET = Object.entries(plates)
  .map(([file, url]) => [981 * Number(file.match(/plate-(\d+)x/)[1]), url])
  .sort((a, b) => a[0] - b[0])
  .map(([w, url]) => `${url} ${w}w`)
  .join(', ')
const PLATE_1X = PLATE_SRCSET.split(' ')[0]

// Вузькі й «портретні» вікна — колонкова розкладка (умова збігається з @media в landing.css)
const NARROW_QUERY = '(max-width: 720px), (max-aspect-ratio: 1 / 1)'
// ширина плити на екрані: на ПК вона = min(100vw, 100vh * 981/639), на вузькому екрані арт у 1.9 раза ширший за вікно
const PLATE_SIZES = `${NARROW_QUERY.split(', ').map((q) => `${q} 190vw`).join(', ')}, min(100vw, calc(100vh * 981 / 639))`

// ?art=vector — сцена як трасований SVG (режим для порівняння); за замовчуванням — плита
const VECTOR = new URLSearchParams(window.location.search).get('art') === 'vector'

// cx — центр іконки в координатах референсу (981x639); d — його зсув від центру рівної колонки панелі (40 ... 941)
const FEATURES = [
  { id: 'tarot', label: 'Tarot', icon: tarot, cx: 148.5, route: 'tarot' },
  { id: 'dreams', label: 'Dream Journal', icon: dreams, cx: 376.5, route: 'dreams' },
  { id: 'astrology', label: 'Astrology', icon: astrology, cx: 602.5, route: 'astrology' },
  { id: 'assistant', label: 'AI Assistant', icon: assistant, cx: 828.5, route: 'companion' },
].map((f, k) => ({ ...f, k, d: f.cx - (40 + (k + 0.5) * 225.25) })) // −4.125, −1.375, −0.625, 0.125: точні двійкові дроби, тож іконки лягають на ціле px

function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', notify)
      return () => m.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function ArtImg(props) {
  return (
    <img
      src={VECTOR ? traced : PLATE_1X}
      srcSet={VECTOR ? undefined : PLATE_SRCSET}
      sizes={VECTOR ? undefined : PLATE_SIZES}
      width="981"
      height="639"
      alt=""
      draggable="false"
      decoding="async"
      {...props}
    />
  )
}

export default function Landing() {
  const narrow = useMediaQuery(NARROW_QUERY)
  useLang() // підписка: при зміні мови (перемикач EN/УК/ES у куті) тексти перемальовуються

  return (
    <div className="v-landing">
    <main className="page">
      <div className="stage" aria-label={`MYSTIQ — ${t('Discover your inner universe')}`}>
        {narrow ? (
          <ArtImg className="landing-art" aria-hidden="true" />
        ) : (
          // ліва й права частини плити + заповнювач між ними (на ширших за референс екранах)
          <div className="art" aria-hidden="true">
            <div className="art-fill" />
            <div className="art-left">
              <ArtImg fetchPriority="high" />
            </div>
            <div className="art-right">
              <ArtImg fetchPriority="high" />
            </div>
          </div>
        )}

        <header className="topbar">
          <a className="brand" {...navProps('/')} aria-label="LOSTIQ">
            <img className="brand-moon" src={brandMoon} alt="" aria-hidden="true" draggable="false" />
            <span className="brand-name">LOSTIQ</span>
          </a>
          <div className="wordmark">MYSTIQ</div>
        </header>

        <section className="hero">
          <h1>
            <span>{t('Discover your')}</span>
            <span>{t('inner universe')}</span>
          </h1>
          <p className="lead">
            <span>{t('Tarot - Dream Journal - Astrology - AI Companion')}</span>
            <span>{t('MYSTIQ is your personal space for')}</span>
            <span>{t('self-discovery, spiritual growth and')}</span>
            <span>{t('shaping your own destiny.')}</span>
            <span>{t('Explore your world, step by step.')}</span>
          </p>
          <a className="btn btn-primary" {...navProps('/register')}>
            <span>{t('Get started')}</span>
          </a>
          <a className="btn btn-ghost" {...navProps('/login')}>
            <span>{t('Sign in')}</span>
          </a>
        </section>

        <nav className="panel" aria-label={t('MYSTIQ features')}>
          {[1, 2, 3].map((k) => (
            <i className="divider" style={{ '--k': k }} aria-hidden="true" key={k} />
          ))}
          {FEATURES.map(({ id, label, icon, k, d, route }) => (
            <a className="feature" {...navProps(`/${route}`)} key={id} style={{ '--k': k, '--d': d }}>
              <img src={icon} alt="" aria-hidden="true" draggable="false" />
              <span>{t(label)}</span>
            </a>
          ))}
        </nav>
      </div>
    </main>
    </div>
  )
}
