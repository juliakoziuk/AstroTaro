import { sScroll, leaf } from './gen.js'

// Палітра (знята з референсу)
export const GOLD = '#c9a76e'
export const GOLD_HI = '#ecd5a0'
export const GOLD_DIM = '#8d7549'
export const GOLD_DARK = '#5a4a30'

// Тайл дамаску: два S-завитки + листок, дзеркально — лише тонкі лінії
const tileScrolls = sScroll(15, 1.1)
const tileLeaf = leaf(0, 0, 26, 8, 0)

function DamaskTile() {
  const g = (tx, ty, rot, flip = 1) => (
    <g transform={`translate(${tx} ${ty}) rotate(${rot}) scale(${flip} 1)`}>
      <path d={tileScrolls[0]} />
      <path d={tileScrolls[1]} />
    </g>
  )
  const lf = (tx, ty, rot) => (
    <g transform={`translate(${tx} ${ty}) rotate(${rot})`}>
      <path d={tileLeaf.body} />
      <path d={tileLeaf.vein} />
    </g>
  )
  return (
    <pattern id="damask" width="150" height="150" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="#7d97bd" strokeWidth="1" strokeLinecap="round">
        {g(40, 40, 30)}
        {g(110, 40, 150, 1)}
        {g(40, 110, -30, -1)}
        {g(110, 110, 210, -1)}
        {lf(75, 75, -90)}
        {lf(75, 75, 90)}
        {lf(75, 75, 0)}
        {lf(75, 75, 180)}
        <circle cx="75" cy="75" r="4" />
        <circle cx="75" cy="75" r="9" strokeDasharray="1 3" />
        <path d="M0 0 12 12M150 0 138 12M0 150 12 138M150 150 138 138" />
      </g>
    </pattern>
  )
}

export default function Defs() {
  return (
    <defs>
      {/* фон */}
      <linearGradient id="bgBase" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#050d1a" />
        <stop offset=".5" stopColor="#081628" />
        <stop offset="1" stopColor="#06112a" />
      </linearGradient>
      <radialGradient id="bgGlowR" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#24406a" stopOpacity=".85" />
        <stop offset=".5" stopColor="#152a4b" stopOpacity=".5" />
        <stop offset="1" stopColor="#0a1a30" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="vignette" cx=".52" cy=".42" r=".72">
        <stop offset=".3" stopColor="#020712" stopOpacity="0" />
        <stop offset=".75" stopColor="#020712" stopOpacity=".5" />
        <stop offset="1" stopColor="#020712" stopOpacity=".9" />
      </radialGradient>
      <radialGradient id="edgeMaskG" cx=".5" cy=".45" r=".62">
        <stop offset=".25" stopColor="#000" />
        <stop offset="1" stopColor="#fff" />
      </radialGradient>
      <mask id="edgeMask">
        <rect width="981" height="640" fill="url(#edgeMaskG)" />
      </mask>
      <filter id="dropSh" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="3" stdDeviation="3.2" floodColor="#010510" floodOpacity=".85" />
      </filter>
      <filter id="deepSh" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="-3" dy="5" stdDeviation="5" floodColor="#010510" floodOpacity=".9" />
      </filter>
      <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#050c18" stopOpacity="0" />
        <stop offset="1" stopColor="#050c18" stopOpacity=".7" />
      </linearGradient>

      {/* золото */}
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f1dcaa" />
        <stop offset=".45" stopColor="#c4a068" />
        <stop offset="1" stopColor="#7c643c" />
      </linearGradient>
      <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#5f4d31" />
        <stop offset=".35" stopColor="#e2c58c" />
        <stop offset=".6" stopColor="#b08f5a" />
        <stop offset="1" stopColor="#4d3e29" />
      </linearGradient>
      <linearGradient id="goldLine" gradientUnits="userSpaceOnUse" x1="600" y1="60" x2="981" y2="460">
        <stop offset="0" stopColor="#7d6842" />
        <stop offset=".5" stopColor="#d3b680" />
        <stop offset="1" stopColor="#7d6842" />
      </linearGradient>

      {/* небо в арці */}
      <radialGradient id="sky" cx=".5" cy=".62" r=".7">
        <stop offset="0" stopColor="#25416d" />
        <stop offset=".45" stopColor="#15294a" />
        <stop offset="1" stopColor="#070f21" />
      </radialGradient>
      <linearGradient id="frameBand" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0d1d36" />
        <stop offset=".5" stopColor="#1a3659" />
        <stop offset="1" stopColor="#0d1d36" />
      </linearGradient>

      {/* місяць */}
      <linearGradient id="moon" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#a4803f" />
        <stop offset=".35" stopColor="#e9cb87" />
        <stop offset=".7" stopColor="#f7e5b4" />
        <stop offset="1" stopColor="#c9a25a" />
      </linearGradient>
      <radialGradient id="moonGlow">
        <stop offset="0" stopColor="#f0cf8a" stopOpacity=".55" />
        <stop offset=".45" stopColor="#c99f57" stopOpacity=".18" />
        <stop offset="1" stopColor="#c99f57" stopOpacity="0" />
      </radialGradient>

      {/* свічки */}
      <linearGradient id="wax" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8e7e5d" />
        <stop offset=".3" stopColor="#e9dec3" />
        <stop offset=".62" stopColor="#d3c39d" />
        <stop offset="1" stopColor="#6d6048" />
      </linearGradient>
      <radialGradient id="flame" cx=".5" cy=".78" r=".75">
        <stop offset="0" stopColor="#fffbe9" />
        <stop offset=".35" stopColor="#ffd77f" />
        <stop offset=".8" stopColor="#f19a35" />
        <stop offset="1" stopColor="#e07a1c" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="flameGlow">
        <stop offset="0" stopColor="#ffd27a" stopOpacity=".7" />
        <stop offset=".4" stopColor="#e8a24a" stopOpacity=".22" />
        <stop offset="1" stopColor="#e8a24a" stopOpacity="0" />
      </radialGradient>

      {/* камінь, листя */}
      <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0f1e33" />
        <stop offset=".5" stopColor="#27405e" />
        <stop offset="1" stopColor="#0f1e33" />
      </linearGradient>
      <linearGradient id="leafFill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="640">
        <stop offset="0" stopColor="#16365a" />
        <stop offset="1" stopColor="#0b1d36" />
      </linearGradient>

      {/* фільтри */}
      <filter id="blurS" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
      <filter id="blurM" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id="blurL" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
      <filter id="glowF" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* хмарна фактура неба */}
      <filter id="clouds" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".022 .035" numOctaves="4" seed="7" />
        <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .62  0 0 0 0 .95  0 0 0 1.6 -.55" />
      </filter>
      {/* дрібне зерно живопису */}
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="11" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 .75  0 0 0 0 .82  0 0 0 0 1  0 0 0 .55 -.18" />
      </filter>

      <symbol id="spark" viewBox="-16 -16 32 32" overflow="visible">
        <path
          d="M0-15C-1.4-5-4.5-1.6-15 0-4.5 1.6-1.4 5 0 15 1.4 5 4.5 1.6 15 0 4.5-1.6 1.4-5 0-15Z"
          fill="#f1d79d"
        />
        <circle r="2" fill="#fff6dc" />
      </symbol>

      <DamaskTile />
    </defs>
  )
}
