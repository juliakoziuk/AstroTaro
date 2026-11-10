import { t } from '../i18n/index.js'
import { NAV, activeNav } from './nav.js'
import { navProps, useRoute } from './router.js'
import { AccessIcon, AnalyticsIcon, HelpIcon, HistoryIcon, HomeIcon, MoonIcon, SettingsIcon, SparkleIcon, TarotIcon } from './icons.jsx'

const ICONS = { home: HomeIcon, tarot: TarotIcon, history: HistoryIcon, dreams: MoonIcon, astrology: SparkleIcon, analytics: AnalyticsIcon, access: AccessIcon, settings: SettingsIcon, help: HelpIcon }

/**
 * Меню застосунку: усі розділи за моделлю nav.js, поточний розділ підсвічено (`activeClass`) і позначено aria-current.
 * Один компонент для всіх бічних панелей; вигляд задає CSS кожної (`className` — клас <nav>).
 * `onHelp` — якщо задано, «Help» не переходить за посиланням, а викликає її (на сторінці налаштувань це вкладка «About»).
 */
export default function NavLinks({ className, activeClass = 'on', onHelp }) {
  const active = activeNav(useRoute())
  return (
    <nav className={className} aria-label={t('Main navigation')}>
      {NAV.map(({ id, label, path }) => {
        const Icon = ICONS[id]
        const current = id === active
        return (
          <a
            key={id}
            {...navProps(path)}
            {...(id === 'help' && onHelp ? { onClick: (event) => (event.preventDefault(), onHelp()) } : {})}
            className={current ? activeClass : undefined}
            aria-current={current ? 'page' : undefined}
          >
            <Icon />
            <span>{t(label)}</span>
          </a>
        )
      })}
    </nav>
  )
}
