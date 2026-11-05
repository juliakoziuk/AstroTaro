// Екран Astrology: натальна карта з дати народження, поточні транзити, найближчі фази Місяця (GET /astrology).
import { get, post } from '../../lib/api.js'
import { formatDay } from '../format.js'
import { t } from '../../i18n/index.js'
import { loadSettings } from './common.js'
import { ProfileModal } from './profile.jsx'
import { Zone } from './parts.jsx'
import { ReportDialog, UpgradeDialog } from './reports.jsx'

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
const CURRENT = ['Mercury in Gemini', 'Venus in Leo', 'Mars in Taurus']
const DASH = '—'

export const astrology = {
  bind: [
    ...PLANETS.map((find) => ({ find, offset: 1, key: `pl.${find}`, rx: 1426 })), // знаки вирівняні по правому краю, перед значком планети
    { find: 'Sun Sign', offset: 1, key: 'ess.sun', maxw: 62 },
    { find: 'Moon Sign', offset: 1, key: 'ess.moon', maxw: 62 },
    { find: 'Ascendant', offset: 1, key: 'ess.asc', maxw: 62 },
    ...CURRENT.map((find, i) => ({ find, key: `cur${i}` })),
    { find: 'New Moon', key: 'ev0.name', maxw: 85 }, // праворуч одразу дата
    { find: 'Nov 1, 2026', key: 'ev0.date' },
    { find: 'Full Moon', key: 'ev1.name', maxw: 85 },
    { find: 'Nov 15, 2026', key: 'ev1.date' },
  ],
  async load() {
    const [a, profile, s] = await Promise.all([get('/astrology'), get('/profile'), loadSettings()])
    const values = { 'ess.sun': a.natal?.sun ?? DASH, 'ess.moon': a.natal?.moon ?? DASH, 'ess.asc': a.natal?.ascendant ?? DASH }
    PLANETS.forEach((p) => (values[`pl.${p}`] = a.natal?.planets.find((x) => x.name === p)?.signName ?? DASH))
    a.current.forEach((p, i) => (values[`cur${i}`] = p.label))
    a.events.forEach((e, i) => {
      values[`ev${i}.name`] = e.name
      values[`ev${i}.date`] = formatDay(e.date, s.dateFormat)
    })
    return { values, data: { astro: a, profile } }
  },
  actions: {
    'Generate Report': async (ctx) => {
      if (ctx.data.profile.plan === 'free') return ctx.openModal({ name: 'upgrade' })
      if (!ctx.data.astro.natal) return ctx.openModal({ name: 'profile' })
      // звіт показуємо одразу, а не лише рахуємо в профілі
      ctx.openModal({ name: 'report', report: await post('/astrology/reports') })
    },
  },
  Over({ ctx }) {
    const need = ctx.data && !ctx.data.astro.natal
    return (
      <>
        {need && (
          <div className="toast" role="status">
            {t('Add your birth date to see your natal chart')}
            <button type="button" onClick={() => ctx.openModal({ name: 'profile' })}>{t('Add')}</button>
          </div>
        )}
        {/* рядки меню та картка подій ведуть на сторінку «Cosmic Today» (транзити, прогноз, календар) */}
        <Zone at={[300, 300, 390, 92]} label="Transits" onClick={() => ctx.go('/today')} />
        <Zone at={[300, 485, 390, 88]} label="Daily Forecast" onClick={() => ctx.go('/today')} />
        <Zone at={[300, 575, 390, 92]} label="Astro Calendar" onClick={() => ctx.go('/today')} />
        <Zone at={[1255, 598, 232, 165, 22]} label="Upcoming Events" onClick={() => ctx.go('/today')} />
        {ctx.modal?.name === 'profile' && <ProfileModal ctx={ctx} profile={ctx.data?.profile} />}
        {ctx.modal?.name === 'upgrade' && <UpgradeDialog onClose={ctx.closeModal} onPlans={() => (ctx.closeModal(), ctx.go('/pricing'))} />}
        {ctx.modal?.name === 'report' && <ReportDialog report={ctx.modal.report} onClose={ctx.closeModal} />}
      </>
    )
  },
}
