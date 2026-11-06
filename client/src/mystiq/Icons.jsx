const PATHS = {
  dashboard: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6l1.4 4.6L18 12l-4.6 1.4L12 18l-1.4-4.6L6 12l4.6-1.4z" />
    </>
  ),
  tarot: (
    <>
      <rect x="4.5" y="4.5" width="10" height="15" rx="1" transform="rotate(-9 9.5 12)" />
      <rect x="9.5" y="4.5" width="10" height="15" rx="1" transform="rotate(9 14.5 12)" />
    </>
  ),
  dreams: (
    <>
      <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
      <path d="M16 5l.7 1.6L18.3 7.3l-1.6.7L16 9.6l-.7-1.6-1.6-.7 1.6-.7z" />
    </>
  ),
  astrology: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </>
  ),
  journal: (
    <>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M8 4v16M11.5 9h4.5" />
    </>
  ),
  companion: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  market: (
    <>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.500 2h-15zM10 21h4" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.500 20a7.500 7.500 0 0 1 15 0" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />,
  logout: <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />,
  history: <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />,
}

export function Icon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
