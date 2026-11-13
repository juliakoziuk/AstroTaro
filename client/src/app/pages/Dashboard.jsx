import { get } from '../../lib/api.js'
import { t, useLang } from '../../i18n/index.js'
import { greeting } from '../format.js'
import AppPage from '../AppPage.jsx'
import { navProps } from '../router.js'
import { AnalyticsIcon, HistoryIcon, MoonIcon, SparkleIcon, SunIcon, TarotIcon } from '../icons.jsx'
import { usePage } from '../usePage.js'
import { LoadError, Loading } from './parts.jsx'

const load = () => get('/dashboard')

const TILES = [
  ['/tarot', TarotIcon, 'Tarot', 'Get a reading'],
  ['/dreams', MoonIcon, 'Dreams', 'Log a dream'],
  ['/astrology', SparkleIcon, 'Astrology', 'Explore your chart'],
  ['/dreams', HistoryIcon, 'Journal', 'Write and reflect'],
  ['/today', SunIcon, 'Cosmic Today', 'The sky now'],
  ['/profile', AnalyticsIcon, 'Progress', 'Track your growth'],
]

export default function Dashboard() {
  useLang()
  const page = usePage(load)
  const d = page.data
  return (
    <AppPage title={d ? `${t(greeting())} ${d.name}` : t('Dashboard')} subtitle={t('Your personal space for insight and balance')}>
      <LoadError page={page} />
      {!d && page.status === 'loading' && <Loading />}
      <div className="ap-cols">
        <div className="ap-stack">
          <div className="ap-tiles big">
            {TILES.map(([path, Icon, name, hint]) => (
              <a key={name} className="ap-tile" {...navProps(path)}>
                <Icon />
                <span><b>{t(name)}</b><small>{t(hint)}</small></span>
              </a>
            ))}
          </div>
        </div>
        <div className="ap-stack">
          <section className="ap-panel">
            <h2>{t('Your Monthly Insight')}</h2>
            <p className="ap-prose">{d?.insight ?? ''}</p>
            <a className="ap-btn" {...navProps('/today')}>{t('Monthly Insight')}</a>
          </section>
          <section className="ap-panel">
            <h2>{t('Your Activity')}</h2>
            <div className="ap-stats">
              {[['readings', 'Tarot readings'], ['dreams', 'Dreams logged'], ['journal', 'Journal entries'], ['reports', 'Reports']].map(([key, label]) => (
                <a key={key} className="ap-stat" {...navProps('/profile')}>
                  <b>{d?.counts[key] ?? '–'}</b>
                  <span>{t(label)}</span>
                </a>
              ))}
            </div>
          </section>
          <section className="ap-panel">
            <h2>{t('Your Progress')}</h2>
            <p>{t('Personal growth this month')}</p>
            <div className="ap-big">{d ? `${d.progress}%` : '–'}</div>
            <div className="ap-meter" role="progressbar" aria-label={t('Your Progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={d?.progress ?? 0}>
              <i style={{ width: `${d?.progress ?? 0}%` }} />
            </div>
          </section>
        </div>
      </div>
    </AppPage>
  )
}
