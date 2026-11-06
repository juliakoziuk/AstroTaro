import { degreeLabel, pointAt, spreadPlanets } from './wheelLayout.js'
import { ASPECT_LINE_WIDTH, ASPECT_MIN_OPACITY, ASPECT_STYLES, PLANET_GLYPHS, SIGN_ARC_DEGREES, SIGN_GLYPHS, WHEEL_COLORS } from './zodiacWheel.constants.js'

// Подвійне колесо синастрії в власних одиницях (центр 0,0): знаки по краю, планети партнера на зовнішньому кільці,
// твої — на внутрішньому, лінії всередині — аспекти між двома картами.
const VIEW = 232
const RIM = 218
const SIGN_INNER = 192
const SIGN_GLYPH_AT = 205
const PARTNER_RING = 150
const PARTNER_GLYPH_AT = 172
const MINE_RING = 112
const MINE_GLYPH_AT = 132
const ASPECT_RING = 98
const SIGN_SIZE = 18
const GLYPH_SIZE = 17
const DEGREE_SIZE = 8.5
const DEGREE_OFFSET = 15
const HALF_SIGN = SIGN_ARC_DEGREES / 2
export const SYNASTRY_COLORS = { mine: WHEEL_COLORS.planet, partner: '#f0a0c0' }

const GLYPH_ATTRS = { textAnchor: 'middle', dominantBaseline: 'central' }
const lineProps = (a, b) => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
const at = (longitude, radius) => pointAt(longitude, radius)

/** Планети однієї людини на своєму кільці: риска на колі, значок і градуси (близькі довготи розсунуто). */
function Ring({ planets, ring, glyphAt, color }) {
  return spreadPlanets(planets).map((p) => {
    const glyph = at(p.shown, glyphAt)
    const degree = at(p.shown, glyphAt - DEGREE_OFFSET)
    return (
      <g key={p.name}>
        <line {...lineProps(at(p.longitude, ring - 6), at(p.longitude, ring + 6))} stroke={color} strokeWidth="2" />
        <text {...glyph} fontSize={GLYPH_SIZE} fill={color} {...GLYPH_ATTRS}>{PLANET_GLYPHS[p.name]}</text>
        <text {...degree} fontSize={DEGREE_SIZE} fill={WHEEL_COLORS.degree} {...GLYPH_ATTRS}>{degreeLabel(p.longitude % SIGN_ARC_DEGREES)}</text>
      </g>
    )
  })
}

export function SynastryWheel({ me, partner, aspects, label }) {
  const longitude = (person, name) => person.planets.find((p) => p.name === name)?.longitude
  return (
    <svg className="syn-wheel" viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} role="img" aria-label={label}>
      <circle r={RIM} fill={WHEEL_COLORS.cover} stroke={WHEEL_COLORS.gold} strokeWidth="1.5" />
      <circle r={SIGN_INNER} fill={WHEEL_COLORS.inner} stroke={WHEEL_COLORS.gold} strokeWidth="1.5" />
      <circle r={PARTNER_RING} fill="none" stroke={SYNASTRY_COLORS.partner} strokeOpacity="0.35" strokeWidth="1" />
      <circle r={MINE_RING} fill="none" stroke={SYNASTRY_COLORS.mine} strokeOpacity="0.35" strokeWidth="1" />
      <circle r={ASPECT_RING} fill="none" stroke={WHEEL_COLORS.goldSoft} strokeWidth="1" />

      {SIGN_GLYPHS.map((glyph, i) => (
        <g key={glyph}>
          <line {...lineProps(at(i * SIGN_ARC_DEGREES, SIGN_INNER), at(i * SIGN_ARC_DEGREES, RIM))} stroke={WHEEL_COLORS.goldSoft} strokeWidth="1" />
          <text {...at(i * SIGN_ARC_DEGREES + HALF_SIGN, SIGN_GLYPH_AT)} fontSize={SIGN_SIZE} fill={WHEEL_COLORS.gold} {...GLYPH_ATTRS}>{glyph}</text>
        </g>
      ))}

      {aspects.map(({ a, b, type, orb, orbMax }) => {
        const style = ASPECT_STYLES[type]
        const [from, to] = [longitude(me, a), longitude(partner, b)]
        if (!style || from === undefined || to === undefined) return null // сполучення — без лінії
        return (
          <line
            key={`${a}-${b}`}
            {...lineProps(at(from, ASPECT_RING), at(to, ASPECT_RING))}
            stroke={style.color}
            strokeDasharray={style.dash}
            strokeWidth={ASPECT_LINE_WIDTH}
            opacity={Math.max(ASPECT_MIN_OPACITY, 1 - orb / orbMax)}
          >
            <title>{`${me.name} ${a} – ${partner.name} ${b}: ${type} (${orb.toFixed(1)}°)`}</title>
          </line>
        )
      })}
      {aspects
        .filter(({ type }) => type === 'conjunction')
        .map(({ a, b }) => {
          const point = at(longitude(me, a) ?? 0, ASPECT_RING)
          return <circle key={`c-${a}-${b}`} cx={point.x} cy={point.y} r="3.5" fill="none" stroke={WHEEL_COLORS.gold} strokeWidth="1.4" />
        })}

      <Ring planets={partner.planets} ring={PARTNER_RING} glyphAt={PARTNER_GLYPH_AT} color={SYNASTRY_COLORS.partner} />
      <Ring planets={me.planets} ring={MINE_RING} glyphAt={MINE_GLYPH_AT} color={SYNASTRY_COLORS.mine} />
    </svg>
  )
}
