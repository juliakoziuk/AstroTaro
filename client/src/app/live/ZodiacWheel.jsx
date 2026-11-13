import { useTheme } from '../../lib/theme.js'
import { degreeLabel, pointAt, spreadPlanets } from './wheelLayout.js'
import {
  ANGLE_LABEL_RADIUS,
  ANGLE_LABEL_SIZE,
  ASPECT_LINE_WIDTH,
  ASPECT_MIN_OPACITY,
  ASPECT_RING_RADIUS,
  ASPECT_STYLES,
  CENTER_DOT_RADIUS,
  FULL_CIRCLE_DEGREES,
  HOUSE_NUMBER_RADIUS,
  HOUSE_NUMBER_SIZE,
  PLANET_DEGREE_RADIUS,
  PLANET_DEGREE_SIZE,
  PLANET_GLYPHS,
  PLANET_GLYPH_RADIUS,
  PLANET_GLYPH_SIZE,
  PLANET_TICK_INNER_RADIUS,
  RETROGRADE_MARK,
  SIGN_ARC_DEGREES,
  SIGN_GLYPHS,
  SIGN_GLYPH_RADIUS,
  SIGN_GLYPH_SIZE,
  SIGN_RING_INNER_RADIUS,
  wheelColors,
  WHEEL_COVER_RADIUS,
  WHEEL_RIM_RADIUS,
  WHEEL_VIEW_RADIUS,
} from './zodiacWheel.constants.js'

const HALF_SIGN = SIGN_ARC_DEGREES / 2
const HALF_CIRCLE = FULL_CIRCLE_DEGREES / 2
const VIEW_BOX = `${-WHEEL_VIEW_RADIUS} ${-WHEEL_VIEW_RADIUS} ${WHEEL_VIEW_RADIUS * 2} ${WHEEL_VIEW_RADIUS * 2}`
const norm = (d) => ((d % FULL_CIRCLE_DEGREES) + FULL_CIRCLE_DEGREES) % FULL_CIRCLE_DEGREES
const GLYPH_ATTRS = { textAnchor: 'middle', dominantBaseline: 'central' }
const lineProps = (a, b) => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })

/**
 * Живе зодіакальне колесо поверх намальованого. Натальна карта (є час і місце): Асцендент зліва, будинки за Плацідусом,
 * кути ASC/DC/MC/IC. Без часу — знаки з 0° Овна ліворуч; без дати народження — небо зараз. Лінії всередині — аспекти.
 */
export function ZodiacWheel({ planets, aspects = [], houses = null, angles = null, label }) {
  const colors = wheelColors(useTheme())
  const asc = angles?.ascendant ?? 0
  const at = (longitude, radius) => pointAt(longitude, radius, asc)
  const placed = spreadPlanets(planets)
  const longitudeOf = Object.fromEntries(planets.map((p) => [p.name, p.longitude]))
  const axes = angles ? [['AC', angles.ascendant], ['DC', angles.ascendant + HALF_CIRCLE], ['MC', angles.midheaven], ['IC', angles.midheaven + HALF_CIRCLE]] : []

  return (
    <div className="ap-wheel" role="img" aria-label={label}>
      <svg viewBox={VIEW_BOX} width="100%" height="100%">
        <circle r={WHEEL_COVER_RADIUS} fill={colors.cover} />
        <circle r={ASPECT_RING_RADIUS} fill={colors.inner} />
        <circle r={WHEEL_RIM_RADIUS} fill="none" stroke={colors.gold} strokeWidth="1.5" />
        <circle r={SIGN_RING_INNER_RADIUS} fill="none" stroke={colors.gold} strokeWidth="1.5" />
        <circle r={ASPECT_RING_RADIUS} fill="none" stroke={colors.goldSoft} strokeWidth="1" />

        {SIGN_GLYPHS.map((glyph, i) => (
          <g key={glyph}>
            <line {...lineProps(at(i * SIGN_ARC_DEGREES, SIGN_RING_INNER_RADIUS), at(i * SIGN_ARC_DEGREES, WHEEL_RIM_RADIUS))} stroke={colors.goldSoft} strokeWidth="1" />
            <text {...at(i * SIGN_ARC_DEGREES + HALF_SIGN, SIGN_GLYPH_RADIUS)} fontSize={SIGN_GLYPH_SIZE} fill={colors.gold} {...GLYPH_ATTRS}>{glyph}</text>
          </g>
        ))}

        {houses?.map((cusp, i) => {
          const middle = cusp + norm(houses[(i + 1) % houses.length] - cusp) / 2
          return (
            <g key={cusp}>
              <line {...lineProps(at(cusp, ASPECT_RING_RADIUS), at(cusp, SIGN_RING_INNER_RADIUS))} stroke={colors.houseLine} strokeWidth="1" />
              <text {...at(middle, HOUSE_NUMBER_RADIUS)} fontSize={HOUSE_NUMBER_SIZE} fill={colors.degree} {...GLYPH_ATTRS}>{i + 1}</text>
            </g>
          )
        })}

        {axes.map(([name, longitude]) => (
          <g key={name}>
            <line {...lineProps(at(longitude, ASPECT_RING_RADIUS), at(longitude, WHEEL_RIM_RADIUS))} stroke={colors.gold} strokeWidth="1.6" />
            <text {...at(longitude, ANGLE_LABEL_RADIUS)} fontSize={ANGLE_LABEL_SIZE} fill={colors.gold} fontWeight="600" {...GLYPH_ATTRS}>{name}</text>
          </g>
        ))}

        {aspects.map(({ a, b, type, orb, orbMax }) => {
          const style = ASPECT_STYLES[type]
          if (!style || longitudeOf[a] === undefined || longitudeOf[b] === undefined) return null // сполучення — без лінії
          return (
            <line
              key={`${a}-${b}`}
              {...lineProps(at(longitudeOf[a], ASPECT_RING_RADIUS), at(longitudeOf[b], ASPECT_RING_RADIUS))}
              stroke={style.color}
              strokeDasharray={style.dash}
              strokeWidth={ASPECT_LINE_WIDTH}
              opacity={Math.max(ASPECT_MIN_OPACITY, 1 - orb / orbMax)}
            >
              <title>{`${a} – ${b}: ${type} (${orb.toFixed(1)}°)`}</title>
            </line>
          )
        })}
        <circle r={CENTER_DOT_RADIUS} fill={colors.gold} />

        {placed.map((p) => {
          const glyphAt = at(p.shown, PLANET_GLYPH_RADIUS)
          const degreeAt = at(p.shown, PLANET_DEGREE_RADIUS)
          return (
            <g key={p.name}>
              <line {...lineProps(at(p.longitude, PLANET_TICK_INNER_RADIUS), at(p.longitude, SIGN_RING_INNER_RADIUS))} stroke={colors.planet} strokeWidth="2" />
              <circle cx={at(p.longitude, ASPECT_RING_RADIUS).x} cy={at(p.longitude, ASPECT_RING_RADIUS).y} r="2" fill={colors.planet} />
              <text {...glyphAt} fontSize={PLANET_GLYPH_SIZE} fill={colors.planet} {...GLYPH_ATTRS}>{PLANET_GLYPHS[p.name]}</text>
              <text {...degreeAt} fontSize={PLANET_DEGREE_SIZE} fill={colors.degree} {...GLYPH_ATTRS}>{degreeLabel(p.longitude % SIGN_ARC_DEGREES)}{p.retrograde ? RETROGRADE_MARK : ''}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
