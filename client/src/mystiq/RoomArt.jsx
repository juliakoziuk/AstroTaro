import { useId } from 'react'

// Нео-ілюстрації кімнат: неонові лінії та світіння, без растрових картинок.
// Кожна ілюстрація заповнює контейнер (preserveAspectRatio slice).

const TONES = {
  astrology: ["#e8c77a", "#6f8fe0", "#f6e6b8"],
  tarot: ["#f0b6c6", "#e8c77a", "#8fa4ee"],
  dreams: ["#9cc4ff", "#6f8fe0", "#f6e6b8"],
  journal: ["#f2cf8f", "#8fa4ee", "#f6e6b8"],
  history: ["#e8c77a", "#f0b6c6", "#6f8fe0"],
  clouds: ["#24427f", "#162a56", "#c9a45c"],
}

function Sparks({ seed = 1, n = 26, color = '#fff' }) {
  // детермінований «пил» зірок
  const pts = Array.from({ length: n }, (_, i) => {
    const a = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453
    const b = Math.sin(seed * 39.346 + i * 11.135) * 24634.6345
    return [(a - Math.floor(a)) * 300, (b - Math.floor(b)) * 400, 0.6 + ((a * b) % 1 + 1) % 1 * 1.6]
  })
  return (
    <g fill={color}>
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={p[2]} opacity={0.35 + (i % 4) * 0.15} />
      ))}
    </g>
  )
}

function Wheel({ c }) {
  const ticks = Array.from({ length: 48 }, (_, i) => i * 7.5)
  return (
    <g transform="translate(150 190)">
      {[130, 108, 86, 56].map((r, i) => (
        <circle key={r} r={r} fill="none" stroke={c[i % 3]} strokeWidth={i === 0 ? 2.4 : 1.2} opacity={0.9 - i * 0.12} filter="url(#glow)" />
      ))}
      {ticks.map((a) => (
        <line key={a} x1="0" y1="-130" x2="0" y2={a % 30 === 0 ? -114 : -122} stroke={c[0]} strokeWidth="1.2" transform={`rotate(${a})`} opacity="0.8" />
      ))}
      {[0, 60, 120].map((a) => (
        <path key={a} d="M0 -86L74 43H-74z" fill="none" stroke={c[1]} strokeWidth="1" opacity="0.7" transform={`rotate(${a + 30})`} />
      ))}
      <circle r="18" fill={c[0]} opacity="0.85" filter="url(#glow)" />
      <circle r="7" fill="#fff" />
    </g>
  )
}

function Fan({ c }) {
  return (
    <g transform="translate(150 250)">
      {[-34, -17, 0, 17, 34].map((a, i) => (
        <g key={a} transform={`rotate(${a}) translate(0 -150)`}>
          <rect x="-34" y="-52" width="68" height="104" rx="7" fill="#150a2e" stroke={c[i % 3]} strokeWidth="1.6" filter="url(#glow)" />
          <rect x="-27" y="-45" width="54" height="90" rx="4" fill="none" stroke={c[i % 3]} strokeWidth="0.8" opacity="0.6" />
          <path d="M0 -22l5 15 16 1-12 10 4 16-13-9-13 9 4-16-12-10 16-1z" fill={c[i % 3]} opacity="0.85" />
        </g>
      ))}
    </g>
  )
}

function Dream({ c }) {
  return (
    <g>
      <circle cx="190" cy="120" r="62" fill={c[2]} opacity="0.9" filter="url(#glow)" />
      <circle cx="212" cy="104" r="56" fill="#150a2e" />
      {[250, 280, 310, 340].map((y, i) => (
        <path
          key={y}
          d={`M0 ${y}q 40 -${14 + i * 3} 80 0t 80 0t 80 0t 80 0`}
          fill="none"
          stroke={c[i % 2]}
          strokeWidth="1.6"
          opacity={0.9 - i * 0.15}
          filter="url(#glow)"
        />
      ))}
      <path d="M40 230q20-40 44-10q24-36 48 6q30-18 40 8z" fill="none" stroke={c[1]} strokeWidth="1.4" opacity="0.8" />
    </g>
  )
}

function Journal({ c }) {
  return (
    <g transform="translate(150 230)">
      <path d="M0 20C-30 0 -80 0 -110 14V120C-80 106 -30 106 0 126C30 106 80 106 110 120V14C80 0 30 0 0 20z" fill="#150a2e" stroke={c[0]} strokeWidth="1.8" filter="url(#glow)" />
      <path d="M0 20V126" stroke={c[0]} strokeWidth="1.2" />
      {[34, 50, 66, 82].map((y) => (
        <g key={y} opacity="0.55">
          <path d={`M-96 ${y}q40-10 86 6`} stroke={c[1]} fill="none" />
          <path d={`M96 ${y}q-40-10 -86 6`} stroke={c[1]} fill="none" />
        </g>
      ))}
      <path d="M40 -30q-6-70 30-110q-20 60 24 70q-40 6-54 40z" fill={c[2]} opacity="0.9" filter="url(#glow)" />
      <circle cx="0" cy="-20" r="46" fill="none" stroke={c[1]} strokeWidth="1" strokeDasharray="2 6" opacity="0.8" />
    </g>
  )
}

function History({ c }) {
  const pts = [[52, 330], [98, 262], [76, 196], [150, 150], [214, 190], [246, 118], [190, 62]]
  return (
    <g>
      <path d={'M' + pts.map((p) => p.join(' ')).join('L')} fill="none" stroke={c[1]} strokeWidth="1.6" filter="url(#glow)" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="14" fill={c[i % 3]} opacity="0.2" />
          <circle cx={p[0]} cy={p[1]} r="5" fill={c[i % 3]} filter="url(#glow)" />
        </g>
      ))}
      <circle cx="150" cy="190" r="120" fill="none" stroke={c[2]} strokeWidth="0.8" strokeDasharray="3 7" opacity="0.7" />
    </g>
  )
}

function Clouds({ c }) {
  const puffs = [[120,250,200,80,0],[330,270,260,90,1],[560,240,230,85,2],[740,280,200,80,0],[220,320,280,70,1],[480,330,300,70,2],[60,170,120,50,2]]
  return (
    <g>
      <circle cx="620" cy="150" r="60" fill="#fff" opacity="0.9" filter="url(#glow)" />
      <circle cx="620" cy="150" r="105" fill={c[0]} opacity="0.25" />
      {puffs.map((p, i) => (
        <ellipse key={i} cx={p[0]} cy={p[1]} rx={p[2]} ry={p[3]} fill={c[p[4]]} opacity="0.45" style={{ filter: "blur(14px)" }} />
      ))}
    </g>
  )
}

const ART = { clouds: Clouds, astrology: Wheel, tarot: Fan, dreams: Dream, journal: Journal, history: History }

export default function RoomArt({ room, className = '', wide = false }) {
  const id = useId()
  const c = TONES[room] ?? TONES.astrology
  const Piece = ART[room] ?? Wheel
  const seed = Object.keys(ART).indexOf(room) + 2
  return (
    <svg className={`mq-art ${className}`} viewBox={room === "clouds" ? "0 0 800 400" : wide ? "0 60 300 260" : "0 0 300 400"} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={`${id}g`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`${id}o`} cx="38%" cy="32%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.35" stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </radialGradient>
        <radialGradient id={`${id}bg`} cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor={c[1]} stopOpacity="0.55" />
          <stop offset="0.55" stopColor={c[0]} stopOpacity="0.14" />
          <stop offset="1" stopColor="#0b0716" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="400" fill="#0b1630" />
      <rect width="800" height="400" fill={`url(#${id}bg)`} />
      {room !== "clouds" && <Sparks seed={seed} />}
      <g style={{ '--g': `url(#${id}g)` }}>
        {/* фільтри/градієнти адресуються через id цього екземпляра */}
        <g filter={undefined}>
          <PieceWrap id={id} Piece={Piece} c={c} />
        </g>
      </g>
    </svg>
  )
}

// Підставляє id-посилання у фрагмент: замінює url(#glow)/url(#orb) на унікальні
function PieceWrap({ id, Piece, c }) {
  return (
    <g data-id={id}>
      <Piece c={c} />
      <style>{`[data-id="${id}"] [filter="url(#glow)"]{filter:drop-shadow(0 0 5px ${c[0]})}[data-id="${id}"] [fill="url(#orb)"]{fill:url(#${id}o)}`}</style>
    </g>
  )
}
