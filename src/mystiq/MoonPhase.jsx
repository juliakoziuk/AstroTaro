import { useId } from 'react'
import { moonPhase } from './astro.js'

// Малює освітлену частину Місяця для будь-якої дати (повна освітленість — 100 %)
export default function MoonPhase({ date, size = 120 }) {
  const id = useId()
  const p = moonPhase(date)
  const waxing = p < 0.5
  const q = waxing ? p : 1 - p
  const r = 50
  const k = Math.cos(2 * Math.PI * q) // +1 новий місяць, 0 чверть, -1 повний
  const rx = Math.abs(k) * r
  const sweep = k > 0 ? 0 : 1
  const lit = `M 60 ${60 - r} A ${r} ${r} 0 0 1 60 ${60 + r} A ${rx} ${r} 0 0 ${sweep} 60 ${60 - r} Z`

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Фаза Місяця">
      <defs>
        <radialGradient id={`${id}-lit`} cx="42%" cy="40%" r="70%">
          <stop offset="0" stopColor="#fbf4de" />
          <stop offset="1" stopColor="#d8c79a" />
        </radialGradient>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="rgba(243,223,168,0.28)" />
          <stop offset="1" stopColor="rgba(243,223,168,0)" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="60" cy="60" r={r} />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="58" fill={`url(#${id}-halo)`} />
      <circle cx="60" cy="60" r={r} fill="#10133a" stroke="rgba(217,181,106,0.45)" strokeWidth="0.8" />
      <g clipPath={`url(#${id}-clip)`}>
        <g transform={waxing ? undefined : 'translate(120 0) scale(-1 1)'}>
          <path d={lit} fill={`url(#${id}-lit)`} />
          <circle cx="48" cy="48" r="5" fill="rgba(150,130,90,0.25)" />
          <circle cx="70" cy="66" r="7" fill="rgba(150,130,90,0.2)" />
          <circle cx="56" cy="76" r="3.5" fill="rgba(150,130,90,0.22)" />
        </g>
      </g>
      <circle cx="60" cy="60" r={r + 5} fill="none" stroke="rgba(217,181,106,0.25)" strokeWidth="0.6" strokeDasharray="1.5 3" />
    </svg>
  )
}
