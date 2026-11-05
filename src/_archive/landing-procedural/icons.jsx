import { leaf } from './art/gen.js'

const LINE = '#b89d70'
const DIM = '#6f5e41'
const FILL = '#0b1a2c'

function Ring() {
  return (
    <g fill="none">
      <circle cx="36" cy="36" r="33.5" stroke={LINE} strokeWidth="1.1" />
      <circle cx="36" cy="36" r="31.3" stroke={DIM} strokeWidth=".6" />
      <g fill={LINE}>
        <circle cx="5" cy="36" r=".9" />
        <circle cx="67" cy="36" r=".9" />
        <circle cx="36" cy="5" r=".9" />
        <circle cx="36" cy="67" r=".9" />
      </g>
    </g>
  )
}

const spark = (x, y, s = 3) => `M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z`

export function TarotIcon() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <Ring />
      <g stroke={LINE} strokeWidth="1" fill={FILL} strokeLinejoin="round">
        <g transform="rotate(15 36 38)">
          <rect x="27" y="16" width="22" height="38" rx="2" />
          <rect x="30" y="19" width="16" height="32" rx="1" fill="none" stroke={DIM} />
        </g>
        <g transform="rotate(-7 36 38)">
          <rect x="21" y="17" width="24" height="39" rx="2" />
          <rect x="24" y="20" width="18" height="33" rx="1" fill="none" stroke={DIM} />
          <path d="M33 29a8 8 0 1 0 4.5 14.5A6.4 6.4 0 1 1 33 29Z" fill="none" />
          <path d={spark(37, 32, 2.2)} fill={LINE} stroke="none" />
          <path d="M26 24q2 2 4 0M36 50q3-2 5 0M26 49q2-2 4 0M38 24q2 2 4 0" fill="none" stroke={DIM} />
        </g>
        <path d="M10 28l-3 3M62 44l3 3M13 52l-2 2" fill="none" />
      </g>
    </svg>
  )
}

const herb = Array.from({ length: 7 }, (_, i) => leaf(34, 30, 8, 2.1, -90 + (i - 3) * 28))

export function DreamIcon() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <Ring />
      <g stroke={LINE} strokeWidth="1" fill={FILL} strokeLinejoin="round" strokeLinecap="round">
        <path d="M24 15h24q-3 3-3 6v26q0 4 4 4H29q-4 0-4-4V21q0-4-1-6Z" />
        <path d="M22 51q-3 0-3 3.5t3 3.5h26q-3-1-3-3.5t3-3.5" fill="none" />
        <path d="M29 41h14M29 45h10" fill="none" stroke={DIM} />
        {herb.map((p, i) => (
          <path key={i} d={p.body} fill={LINE} stroke="none" opacity=".85" />
        ))}
        <path d="M34 31v6" fill="none" />
        <path d="M44 24q8-10 14-9-1 6-8 11" fill="none" />
        <path d="M52 21l-8 12" fill="none" stroke={DIM} />
        <path d={spark(14, 40, 2.5)} fill={LINE} stroke="none" />
        <path d={spark(58, 52, 2)} fill={LINE} stroke="none" />
      </g>
    </svg>
  )
}

const zodiac = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180
  return `M${(36 + 17 * Math.cos(a)).toFixed(1)} ${(40 + 17 * Math.sin(a)).toFixed(1)}L${(36 + 20.5 * Math.cos(a)).toFixed(1)} ${(40 + 20.5 * Math.sin(a)).toFixed(1)}`
}).join('')

export function AstroIcon() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <Ring />
      <g stroke={LINE} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[-62, -36, -12, 12, 36, 62].map((d, i) => {
          const a = ((d - 90) * Math.PI) / 180
          return <path key={i} d={spark(36 + 27 * Math.cos(a), 36 + 27 * Math.sin(a) + 3, 2.2)} fill={LINE} stroke="none" />
        })}
        <circle cx="36" cy="40" r="20.5" />
        <circle cx="36" cy="40" r="17" stroke={DIM} />
        <path d={zodiac} stroke={DIM} />
        <circle cx="36" cy="40" r="11" fill={FILL} />
        <path d="M36 34v13M36 40q-5-2-6-6M36 41q5-2 6-6" />
        <path d="M30 40a6 6 0 0 1 12 0" stroke={DIM} />
        <path d="M17 55q9-3 19 3 10-6 19-3v4q-9-3-19 3-10-6-19-3Z" fill={FILL} />
        <path d="M36 58v-3" />
      </g>
    </svg>
  )
}

export function AssistantIcon() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <Ring />
      <g stroke={LINE} strokeWidth="1" fill={FILL} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="36" cy="29" r="8.5" />
        <path d="M26 29a10 10 0 0 1 20 0" fill="none" strokeWidth="1.3" />
        <rect x="23.5" y="27" width="3.6" height="7" rx="1.5" />
        <rect x="44.9" y="27" width="3.6" height="7" rx="1.5" />
        <path d="M46 33q0 6-8 7" fill="none" />
        <path d="M20 57q0-14 16-14t16 14Z" />
        <path d="M30 44l6 8 6-8" fill="none" />
        <path d="M30 29.5q2-1.6 4 0M38 29.5q2-1.6 4 0M33 34q3 1.6 6 0" fill="none" stroke={DIM} />
        <path d={spark(54, 17, 3)} fill={LINE} stroke="none" />
        <path d={spark(17, 20, 2)} fill={LINE} stroke="none" />
        <path d="M44 51h3m-1.5-1.5v3" fill="none" stroke={DIM} />
      </g>
    </svg>
  )
}

export function BrandMoon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="brandGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1dcaa" />
          <stop offset="1" stopColor="#8b714c" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="none" stroke="url(#brandGold)" strokeWidth="1.3" />
      <path d="M20 6.5a10 10 0 1 0 5.6 14.2A8.4 8.4 0 0 1 20 6.5Z" fill="url(#brandGold)" />
      <path d={spark(24, 11, 2.2)} fill="#f1dcaa" />
    </svg>
  )
}

export function SwapArrow() {
  return (
    <svg viewBox="0 0 40 12" aria-hidden="true" fill="none" stroke="#d1b98f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h34M3 6l4-3.4M3 6l4 3.4M37 6l-4-3.4M37 6l-4 3.4" />
    </svg>
  )
}
