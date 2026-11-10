// Лінійні золоті іконки екрана «Draw your cards» (24x24, штрих currentColor): бічна панель, вкладки, кнопки.
const Svg = ({ children, fill = 'none', ...rest }) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill={fill} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
)

export const ShareIcon = () => (
  <Svg>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
  </Svg>
)
export const HomeIcon = () => (
  <Svg>
    <path d="M3.5 11.2 12 4l8.5 7.2M5.8 9.8V20h4.4v-5.2h3.6V20h4.4V9.8" />
  </Svg>
)
export const TarotIcon = () => (
  <Svg>
    <rect x="3.5" y="5" width="10" height="15" rx="2" />
    <path d="M9.5 3.8 18 2.5l2.5 13.4-4.6.8M8.5 12.5l1 1.8 1.8.3-1.3 1.3.3 1.8-1.8-.9-1.7.9.3-1.8-1.3-1.3 1.8-.3z" />
  </Svg>
)
export const AnalyticsIcon = () => (
  <Svg>
    <path d="M5 20v-7M11 20V5M17 20v-10M3 20.5h18" />
  </Svg>
)
export const AccessIcon = () => (
  <Svg>
    <path d="M12 3l7.5 3v5.2c0 4.7-3.1 8-7.5 9.8-4.4-1.8-7.5-5.1-7.5-9.8V6z" />
    <path d="m8.8 12 2.3 2.3 4.2-4.6" />
  </Svg>
)
export const SettingsIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
  </Svg>
)
export const HelpIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.4 9.6a2.7 2.7 0 1 1 3.9 2.4c-.9.5-1.3 1-1.3 1.9M12 17.2h.01" />
  </Svg>
)
export const DeckIcon = () => (
  <Svg>
    <rect x="5" y="4" width="9" height="14" rx="1.8" />
    <path d="M14 7.2 18 6l2 10-4.2 1.2M9.5 9.5l.9 1.6 1.7.2-1.2 1.2.3 1.7-1.7-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z" />
  </Svg>
)
export const LayersIcon = () => (
  <Svg>
    <path d="m12 3.5 9 4.8-9 4.8-9-4.8zM3 12.6l9 4.8 9-4.8M3 16.8l9 4.7 9-4.7" />
  </Svg>
)
export const UndoIcon = () => (
  <Svg>
    <path d="M4.5 9.5H14a5 5 0 0 1 0 10H8M4.5 9.5 8.5 5.5M4.5 9.5l4 4" />
  </Svg>
)
export const ShuffleIcon = () => (
  <Svg>
    <path d="M3 7.5h3.6c3.2 0 4.2 2 5.4 4.5s2.2 4.5 5.4 4.5H21M3 16.5h3.6c1.6 0 2.7-.5 3.5-1.3M13.9 8.8c.8-.8 1.6-1.3 3.5-1.3H21M18 4.5l3 3-3 3M18 13.5l3 3-3 3" />
  </Svg>
)
export const FeatherIcon = () => (
  <Svg>
    <path d="M20.5 3.5c-7 0-13 4.2-13 11.5L4 20.5M7.5 15h6.5M11 11.3h5.5M14.5 7.7h4" />
  </Svg>
)
export const SparkleIcon = () => (
  <Svg fill="currentColor" strokeWidth="1">
    <path d="M12 2.5 14.2 9.8 21.5 12l-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z" />
  </Svg>
)
export const SunIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Svg>
)
export const LogoutIcon = () => (
  <Svg>
    <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />
  </Svg>
)
export const MoonIcon = () => (
  <Svg>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Svg>
)
export const BookmarkIcon = () => (
  <Svg>
    <path d="M6.5 3.5h11v17L12 16.2 6.5 20.5z" />
  </Svg>
)
export const RefreshIcon = () => (
  <Svg>
    <path d="M20 11a8 8 0 0 0-14.4-4.2L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.4 4.2L20 15.5M20 20v-4.5h-4.5" />
  </Svg>
)
export const HistoryIcon = () => (
  <Svg>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5M3.5 4v4.5H8M12 7.5V12l3 2" />
  </Svg>
)
export const TrashIcon = () => (
  <Svg>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12M10 11v6M14 11v6" />
  </Svg>
)
export const StarIcon = ({ filled }) => (
  <Svg fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3.2 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z" />
  </Svg>
)
