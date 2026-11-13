// Екран Astrology: натальна карта з дати народження, поточні транзити, найближчі фази Місяця (GET /astrology).
import { get, post } from '../../lib/api.js'
import { t, useLang } from '../../i18n/index.js'
import { formatDay } from '../format.js'
import AppPage from '../AppPage.jsx'
import { CompatibilityDialog } from '../live/CompatibilityDialog.jsx'
import { NatalChartDialog } from '../live/NatalChartDialog.jsx'
import { ZodiacWheel } from '../live/ZodiacWheel.jsx'
import { loadSettings } from '../live/common.js'
import { ProfileModal } from '../live/profile.jsx'
import { ReportDialog, UpgradeDialog } from '../live/reports.jsx'
import { usePage } from '../usePage.js'
import { LoadError, Loading } from './parts.jsx'

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
const DASH = '—'

async function load() {
  const [astro, profile, settings] = await Promise.all([get('/astrology'), get('/profile'), loadSettings()])
  return { astro, profile, dateFormat: settings.dateFormat }
}

export default function AstrologyPage() {
  useLang()
  const page = usePage(load)
  const { ctx } = page
  const d = page.data
  const natal = d?.astro.natal
  const chart = natal ?? d?.astro.sky // з датою народження — натальна карта, без неї — небо зараз

  const report = () =>
    ctx.run(async () => {
      if (d.profile.plan === 'free') return ctx.openModal({ name: 'upgrade' })
      if (!natal) return ctx.openModal({ name: 'profile' })
      ctx.openModal({ name: 'report', report: await post('/astrology/reports') }) // звіт показуємо одразу, а не лише рахуємо в профілі
    })

  // рядки меню та картка подій ведуть на сторінку «Cosmic Today» (транзити, прогноз, календар)
  const MENU = [
    ['Natal Chart', 'Your cosmic blueprint', () => ctx.openModal({ name: natal ? 'natal' : 'profile' })],
    ['Transits', 'Current planetary influences', () => ctx.go('/today?section=transits')],
    ['Compatibility', 'Relationship analysis', () => ctx.openModal({ name: 'compat' })],
    ['Daily Forecast', 'Personal astro guidance', () => ctx.go('/today?section=forecast')],
    ['Astro Calendar', 'Important cosmic dates', () => ctx.go('/today?section=calendar')],
  ]

  return (
    <AppPage title={t('Astrology')} subtitle={t('Your natal chart, insights, and cosmic guidance')}>
      <LoadError page={page} />
      {!d && page.status === 'loading' && <Loading />}
      {d && (
        <div className="ap-cols">
          <div className="ap-stack">
            <section className="ap-panel">
              {chart && <ZodiacWheel inline planets={chart.planets} aspects={chart.aspects} houses={natal?.houses} angles={natal?.angles} label={t('Zodiac wheel')} />}
              {!natal && (
                <p className="ap-note" role="status">
                  {t('Add your birth date to see your natal chart')}{' '}
                  <button type="button" className="ap-linkish" onClick={() => ctx.openModal({ name: 'profile' })}>{t('Add')}</button>
                </p>
              )}
            </section>
            <section className="ap-panel">
              <h2>{t('Planets')}</h2>
              <dl className="ap-planets">
                {PLANETS.map((p) => (
                  <div key={p}>
                    <dt>{t(p)}</dt>
                    <dd>{natal?.planets.find((x) => x.name === p)?.signName ?? DASH}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
          <div className="ap-stack">
            <section className="ap-panel">
              <ul className="ap-list">
                {MENU.map(([name, hint, onClick]) => (
                  <li key={name}>
                    <button type="button" className="ap-row" onClick={onClick}>
                      <span className="grow"><b>{t(name)}</b><small>{t(hint)}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="ap-panel">
              <h2>{t('Your Essentials')}</h2>
              <dl className="ap-pairs">
                <div><dt>{t('Sun Sign')}</dt><dd>{natal?.sun ?? DASH}</dd></div>
                <div><dt>{t('Moon Sign')}</dt><dd>{natal?.moon ?? DASH}</dd></div>
                <div><dt>{t('Ascendant')}</dt><dd>{natal?.ascendant ?? DASH}</dd></div>
              </dl>
            </section>
            <section className="ap-panel">
              <h2>{t('Current Influences')}</h2>
              <ul className="ap-list">{d.astro.current.map((p) => <li key={p.label} className="ap-muted">{p.label}</li>)}</ul>
            </section>
            <section className="ap-panel">
              <h2>{t('Upcoming Events')}</h2>
              <dl className="ap-pairs">
                {d.astro.events.map((e) => <div key={e.name + e.date}><dt>{e.name}</dt><dd>{formatDay(e.date, d.dateFormat)}</dd></div>)}
              </dl>
              <div className="ap-actions"><button type="button" className="ap-btn" onClick={() => ctx.go('/today')}>{t('Cosmic Today')}</button></div>
            </section>
            <section className="ap-panel">
              <h2>{t('Get Your Full Astrology Report')}</h2>
              <p>{t('A detailed analysis of your chart, personality, and life path')}</p>
              <button type="button" className="ap-btn primary wide" onClick={report}>{t('Generate Report')}</button>
            </section>
          </div>
        </div>
      )}
      {ctx.modal?.name === 'natal' && natal && <NatalChartDialog natal={natal} onClose={ctx.closeModal} />}
      {ctx.modal?.name === 'compat' && d && <CompatibilityDialog profile={d.profile} onClose={ctx.closeModal} />}
      {ctx.modal?.name === 'profile' && <ProfileModal ctx={ctx} profile={d?.profile} />}
      {ctx.modal?.name === 'upgrade' && <UpgradeDialog onClose={ctx.closeModal} onPlans={() => (ctx.closeModal(), ctx.go('/pricing'))} />}
      {ctx.modal?.name === 'report' && <ReportDialog report={ctx.modal.report} onClose={ctx.closeModal} />}
    </AppPage>
  )
}
