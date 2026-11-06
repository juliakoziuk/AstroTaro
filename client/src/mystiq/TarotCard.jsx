import { useId } from 'react'

const INK = '#1b1850'
const GOLD = '#b0842f'
const FOIL = 'rgba(196,148,52,0.30)'

function starPoints(cx, cy, outer, inner, n, rot = -90) {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = ((rot + (i * 180) / n) * Math.PI) / 180
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

function Sparkles({ spots }) {
  return spots.map(([x, y, s], i) => <polygon key={i} points={starPoints(x, y, s, s * 0.38, 4)} fill={GOLD} stroke="none" />)
}

// Малюнок у центрі карти (область приблизно 100 × 100 навколо точки 100,150)
function Motif({ kind }) {
  switch (kind) {
    case 'path':
      return (
        <g>
          <polyline points="50,208 86,128 108,168 130,138 158,208" />
          <path d="M100 208 Q92 184 104 162" strokeDasharray="3 3" stroke={GOLD} />
          <circle cx="146" cy="92" r="14" fill={FOIL} stroke={GOLD} />
          <path d="M146 68v-7M146 123v7M122 92h-7M177 92h7M129 75l-5-5M163 109l5 5M163 75l5-5M129 109l-5 5" stroke={GOLD} />
          <Sparkles spots={[[64, 96, 7], [84, 70, 4]]} />
        </g>
      )
    case 'infinity':
      return (
        <g>
          <path d="M66 150c0-26 34-26 34 0s34 26 34 0-34-26-34 0-34 26-34 0z" strokeWidth="1.8" />
          <path d="M100 88v112" stroke={GOLD} />
          <polygon points={starPoints(100, 82, 10, 4, 5)} fill={GOLD} stroke="none" />
          <path d="M82 206h36M88 212h24" />
          <circle cx="100" cy="150" r="3" fill={INK} />
        </g>
      )
    case 'pillars':
      return (
        <g>
          <rect x="56" y="96" width="20" height="110" fill={FOIL} stroke={GOLD} />
          <rect x="124" y="96" width="20" height="110" fill={FOIL} stroke={GOLD} />
          <path d="M52 96h28M120 96h28M52 206h28M120 206h28" />
          <path d="M80 106c14 10 26 10 40 0M80 126c14 10 26 10 40 0M80 146c14 10 26 10 40 0" strokeDasharray="2 3" />
          <path d="M112 128a14 14 0 1 1-12-22 11 11 0 0 0 12 22z" fill={GOLD} stroke="none" transform="translate(-1 -6)" />
        </g>
      )
    case 'venus':
      return (
        <g>
          <circle cx="100" cy="128" r="30" fill={FOIL} stroke={GOLD} />
          <path d="M100 158v52M78 184h44" />
          <Sparkles spots={[[56, 108, 6], [146, 112, 6], [100, 82, 8], [60, 176, 4], [142, 178, 4]]} />
          <circle cx="100" cy="128" r="18" strokeDasharray="2 3" />
        </g>
      )
    case 'throne':
      return (
        <g>
          <rect x="64" y="104" width="72" height="100" fill={FOIL} stroke={GOLD} />
          <rect x="74" y="116" width="52" height="40" />
          <path d="M64 104l8-14 14 10 14-14 14 14 14-10 8 14" stroke={GOLD} />
          <path d="M84 204v14M116 204v14M100 156v48" />
          <path d="M44 150c0-18 10-26 24-26M156 150c0-18-10-26-24-26" stroke={GOLD} />
        </g>
      )
    case 'triplecross':
      return (
        <g>
          <path d="M100 86v124" strokeWidth="1.8" />
          <path d="M80 108h40M70 134h60M58 160h84" strokeWidth="1.8" />
          <path d="M100 86l-6 8M100 86l6 8" stroke={GOLD} />
          <Sparkles spots={[[58, 100, 6], [142, 100, 6], [100, 230, 5]]} />
        </g>
      )
    case 'rings':
      return (
        <g>
          <circle cx="84" cy="150" r="32" fill={FOIL} stroke={GOLD} />
          <circle cx="116" cy="150" r="32" fill="rgba(27,24,80,0.10)" />
          <polygon points={starPoints(100, 96, 12, 4.6, 8)} fill={GOLD} stroke="none" />
          <path d="M100 108v10M100 182v12" strokeDasharray="2 3" />
        </g>
      )
    case 'chariot':
      return (
        <g>
          <path d="M70 120l30-26 30 26" strokeWidth="1.8" />
          <path d="M78 134l22-18 22 18" stroke={GOLD} />
          <circle cx="100" cy="176" r="30" fill={FOIL} stroke={GOLD} />
          <circle cx="100" cy="176" r="6" />
          <path d="M100 146v60M70 176h60M79 155l42 42M121 155l-42 42" />
          <path d="M54 204h92" />
        </g>
      )
    case 'flower':
      return (
        <g>
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} cx="100" cy="116" rx="10" ry="24" transform={`rotate(${i * 45} 100 150)`} fill={i % 2 ? FOIL : 'none'} stroke={i % 2 ? GOLD : INK} />
          ))}
          <circle cx="100" cy="150" r="9" fill={GOLD} stroke="none" />
          <path d="M76 214c8-6 16-6 24 0 8-6 16-6 24 0" />
        </g>
      )
    case 'lantern':
      return (
        <g>
          <path d="M88 96c0-14 24-14 24 0" />
          <path d="M84 106h32l6 14v54l-6 12H84l-6-12v-54z" fill={FOIL} stroke={GOLD} />
          <path d="M100 126c-8 10-6 22 0 28 6-6 8-18 0-28z" fill={GOLD} stroke="none" />
          <path d="M100 192v18M92 210h16" />
          <path d="M60 120h-10M150 120h-10M64 96l-8-6M144 96l8-6M64 160l-10 4M146 160l10 4" stroke={GOLD} />
        </g>
      )
    case 'wheel':
      return (
        <g>
          <circle cx="100" cy="150" r="46" fill="none" strokeWidth="1.6" />
          <circle cx="100" cy="150" r="36" stroke={GOLD} strokeDasharray="2 3" />
          <circle cx="100" cy="150" r="9" fill={FOIL} stroke={GOLD} />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M100 141V108" transform={`rotate(${i * 45} 100 150)`} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <circle key={i} cx="100" cy="104" r="3.4" fill={GOLD} stroke="none" transform={`rotate(${i * 45 + 22.5} 100 150)`} />
          ))}
        </g>
      )
    case 'scales':
      return (
        <g>
          <path d="M100 90v118M84 210h32" strokeWidth="1.8" />
          <path d="M58 112h84" />
          <circle cx="100" cy="90" r="5" fill={GOLD} stroke="none" />
          <path d="M58 112l-14 44h28zM142 112l-14 44h28z" stroke={GOLD} />
          <path d="M44 156a14 8 0 0 0 28 0M128 156a14 8 0 0 0 28 0" fill={FOIL} />
        </g>
      )
    case 'hanged':
      return (
        <g>
          <path d="M56 90h88" strokeWidth="1.8" />
          <path d="M100 90v32" />
          <circle cx="100" cy="190" r="16" stroke={GOLD} strokeDasharray="2 3" />
          <circle cx="100" cy="190" r="9" fill={FOIL} />
          <path d="M100 122v50M86 106l14 16 14-16" />
          <path d="M100 150l-18 14M100 150l18 14" />
        </g>
      )
    case 'scythe':
      return (
        <g>
          <path d="M58 98c40-18 84-4 88 54-18-34-52-44-88-54z" fill={FOIL} stroke={GOLD} />
          <path d="M70 92L132 216" strokeWidth="1.8" />
          <circle cx="128" cy="204" r="9" fill="none" />
          <path d="M120 204h16M128 196v16" />
          <Sparkles spots={[[148, 98, 5], [60, 170, 5]]} />
        </g>
      )
    case 'cups':
      return (
        <g>
          <path d="M58 100h34l-6 26a11 11 0 0 1-22 0z" fill={FOIL} stroke={GOLD} />
          <path d="M108 168h34l-6 26a11 11 0 0 1-22 0z" fill={FOIL} stroke={GOLD} />
          <path d="M75 128c8 6 14 14 14 22 0 10 10 14 22 16" strokeDasharray="3 2" />
          <path d="M72 138v10M125 196v14M115 210h20M66 126v10M62 170" />
          <Sparkles spots={[[130, 110, 6], [64, 190, 5]]} />
        </g>
      )
    case 'pentagram':
      return (
        <g>
          <circle cx="100" cy="150" r="52" />
          <polygon points="100,198 70,106 148,162 52,162 130,106" transform="rotate(0 100 150)" fill={FOIL} stroke={GOLD} strokeWidth="1.5" />
          <path d="M56 100l10 8M144 100l-10 8M100 206v12" strokeDasharray="2 3" />
        </g>
      )
    case 'tower':
      return (
        <g>
          <path d="M76 124h48v86H76z" fill={FOIL} stroke={GOLD} />
          <path d="M70 124v-14h10v8h10v-8h10v8h10v-8h10v8h10v-8h10v14" />
          <path d="M92 154h16v22H92zM92 188h16" />
          <path d="M148 80l-20 40 20-8-22 50" stroke={GOLD} strokeWidth="2" />
          <Sparkles spots={[[56, 96, 5], [60, 186, 4], [146, 196, 5]]} />
        </g>
      )
    case 'star':
      return (
        <g>
          <polygon points={starPoints(100, 142, 50, 16, 8)} fill={FOIL} stroke={GOLD} strokeWidth="1.5" />
          <polygon points={starPoints(100, 142, 26, 10, 8, -67.5)} />
          <Sparkles spots={[[50, 88, 7], [152, 92, 6], [56, 206, 5], [150, 204, 7]]} />
        </g>
      )
    case 'moon':
      return (
        <g>
          <path d="M124 90A52 52 0 1 0 124 198 40 40 0 1 1 124 90z" fill={FOIL} stroke={GOLD} strokeWidth="1.5" />
          <path d="M60 220c8-6 14-6 22 0s14 6 22 0 14-6 22 0 14 6 22 0" />
          <Sparkles spots={[[132, 120, 6], [150, 156, 4], [118, 176, 5]]} />
        </g>
      )
    case 'sun':
      return (
        <g>
          <circle cx="100" cy="150" r="26" fill={FOIL} stroke={GOLD} strokeWidth="1.5" />
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={i % 2 ? 'M100 112v-12' : 'M100 118v-26'} transform={`rotate(${i * 22.5} 100 150)`} stroke={i % 2 ? INK : GOLD} />
          ))}
          <circle cx="100" cy="150" r="14" strokeDasharray="2 3" />
        </g>
      )
    case 'trumpet':
      return (
        <g>
          <path d="M54 176l66-34 12 8-60 40z" fill={FOIL} stroke={GOLD} />
          <path d="M120 142l30-30 8 24-26 14z" />
          <path d="M70 104l-8-12M92 94l-4-14M116 90l2-14M142 98l8-10" stroke={GOLD} />
          <path d="M60 214h80M72 224h56" />
        </g>
      )
    case 'wreath':
      return (
        <g>
          {Array.from({ length: 20 }, (_, i) => (
            <ellipse key={i} cx="100" cy="94" rx="5" ry="11" transform={`rotate(${i * 18} 100 150)`} fill={i % 2 ? FOIL : 'none'} stroke={i % 2 ? GOLD : INK} />
          ))}
          <polygon points={starPoints(100, 150, 22, 8, 5)} fill={GOLD} stroke="none" />
          <path d="M82 214l-8 14M118 214l8 14" />
        </g>
      )
    default:
      return null
  }
}

export function CardFace({ card, reversed }) {
  const id = useId()
  return (
    <svg viewBox="0 0 200 300" className="tarot-svg" role="img" aria-label={`${card.name}${reversed ? ', перевернута' : ''}`}>
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#f2ead6" />
          <stop offset="1" stopColor="#dccfae" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="48%" r="50%">
          <stop offset="0" stopColor="rgba(255,244,214,0.9)" />
          <stop offset="1" stopColor="rgba(255,244,214,0)" />
        </radialGradient>
      </defs>
      <rect width="200" height="300" rx="9" fill={`url(#${id}-paper)`} />
      <rect x="7" y="7" width="186" height="286" rx="5" fill="none" stroke={GOLD} strokeWidth="1.6" />
      <rect x="13" y="13" width="174" height="274" rx="3" fill="none" stroke={INK} strokeWidth="0.7" opacity="0.7" />
      <circle cx="100" cy="150" r="78" fill={`url(#${id}-glow)`} />
      {[[13, 13], [187, 13], [13, 287], [187, 287]].map(([x, y], i) => (
        <polygon key={i} points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`} fill={GOLD} />
      ))}
      <text x="100" y="40" textAnchor="middle" fontFamily="Forum, serif" fontSize="17" fill={INK} letterSpacing="3">
        {card.roman}
      </text>
      <g transform={reversed ? 'rotate(180 100 150)' : undefined} fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <Motif kind={card.art} />
      </g>
      <path d="M56 252h88" stroke={GOLD} strokeWidth="0.8" />
      <text x="100" y="272" textAnchor="middle" fontFamily="Forum, serif" fontSize="15" fill={INK} letterSpacing="1.5">
        {card.name}
      </text>
      <text x="100" y="285" textAnchor="middle" fontFamily="Onest, sans-serif" fontSize="6.5" fill={GOLD} letterSpacing="1.6">
        {card.en}
      </text>
    </svg>
  )
}

export function CardBack() {
  const id = useId()
  return (
    <svg viewBox="0 0 200 300" className="tarot-svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a1456" />
          <stop offset="1" stopColor="#0a0b2c" />
        </linearGradient>
      </defs>
      <rect width="200" height="300" rx="9" fill={`url(#${id}-bg)`} />
      <rect x="7" y="7" width="186" height="286" rx="5" fill="none" stroke="#d8b46a" strokeWidth="1.2" />
      <rect x="14" y="14" width="172" height="272" rx="3" fill="none" stroke="#d8b46a" strokeWidth="0.5" opacity="0.6" />
      <g fill="none" stroke="#d8b46a" strokeWidth="0.8" opacity="0.9">
        <circle cx="100" cy="150" r="22" />
        <circle cx="100" cy="150" r="38" strokeDasharray="1.5 3" />
        <circle cx="100" cy="150" r="56" />
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i} d="M100 94v-10" transform={`rotate(${i * 15} 100 150)`} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M100 128v-30" transform={`rotate(${i * 30 + 15} 100 150)`} strokeWidth="0.5" />
        ))}
      </g>
      <polygon points={starPoints(100, 150, 18, 6.5, 8)} fill="#d8b46a" />
      <path d="M100 40c-10 8-10 22 0 30 10-8 10-22 0-30z" fill="none" stroke="#d8b46a" strokeWidth="0.8" />
      <path d="M100 230c-10 8-10 22 0 30 10-8 10-22 0-30z" fill="none" stroke="#d8b46a" strokeWidth="0.8" />
    </svg>
  )
}

// Карта з двома сторонами: спина (колода) і лице (пергамент з малюнком)
export default function TarotCard({ card, reversed = false, flipped = true, width = 150, onClick, className = '', style }) {
  const interactive = typeof onClick === 'function'
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      className={`tarot ${flipped ? 'is-flipped' : ''} ${className}`}
      style={{ '--w': `${width}px`, ...style }}
      onClick={onClick}
      aria-label={interactive ? 'Перевернути карту' : undefined}
    >
      <span className="tarot-inner">
        <span className="tarot-side tarot-back">
          <CardBack />
        </span>
        <span className="tarot-side tarot-front">{card && <CardFace card={card} reversed={reversed} />}</span>
      </span>
    </Tag>
  )
}
