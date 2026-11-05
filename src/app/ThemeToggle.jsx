import { t } from '../i18n/index.js'
import { useTheme } from '../lib/theme.js'
import { chooseTheme } from '../lib/themeSync.js'
import { MoonIcon, SunIcon } from './icons.jsx'

/**
 * Перемикач світлої й темної теми: сонце ліворуч, місяць праворуч, золотий повзунок стоїть під активною темою.
 * На екранах-плитах він лежить на місці намальованого перемикача, на сторінках без плити — внизу бічної панелі.
 */
export default function ThemeToggle({ className = '', style }) {
  const theme = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t('Dark theme')}
      title={dark ? t('Switch to light theme') : t('Switch to dark theme')}
      className={`theme-toggle ${dark ? 'dark' : 'light'} ${className}`}
      style={style}
      onClick={() => chooseTheme(dark ? 'light' : 'dark').catch(() => {})}
    >
      <i aria-hidden="true" />
      <SunIcon />
      <MoonIcon />
    </button>
  )
}
