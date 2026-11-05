import { t } from '../i18n/index.js'
import { navProps } from './router.js'
import scene from './art/draw-scene.webp'
import logo from './art/draw-logo.webp'
import ThemeToggle from './ThemeToggle.jsx'
import { AccessIcon, AnalyticsIcon, ChatIcon, HelpIcon, HistoryIcon, SettingsIcon, TarotIcon } from './icons.jsx'
import './draw.css'

// бічна панель, як на інших екранах застосунку (плюс «History» — перегляд усіх розкладів)
const NAV = [
  ['Tarot', '/tarot', TarotIcon],
  ['History', '/history', HistoryIcon],
  ['Chat', '/companion', ChatIcon],
  ['Analytics', '/analysis', AnalyticsIcon],
  ['Access', '/pricing', AccessIcon],
  ['Settings', '/settings', SettingsIcon],
  ['Help', '/settings', HelpIcon],
]

function Sidebar({ active }) {
  return (
    <aside className="side">
      <a className="logo" {...navProps('/dashboard')} aria-label="MYSTIQ">
        <img src={logo} alt="MYSTIQ" />
      </a>
      <nav>
        {NAV.map(([label, path, Icon]) => (
          <a key={label} className={path === active ? 'on' : ''} {...navProps(path)}>
            <Icon />
            <span>{t(label)}</span>
          </a>
        ))}
      </nav>
      <ThemeToggle className="side-theme" />
    </aside>
  )
}

/** Рамка екранів у стилі «Draw your cards»: сцена-фон, бічна панель і центральна колонка. */
export default function Frame({ active, children }) {
  return (
    <div className="v-app">
      <div className="drawpage" style={{ '--scene': `url(${scene})` }}>
        <Sidebar active={active} />
        <main className="draw">{children}</main>
      </div>
    </div>
  )
}
