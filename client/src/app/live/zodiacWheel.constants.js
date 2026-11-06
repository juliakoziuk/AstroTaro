// Геометрія живого зодіакального колеса в одиницях макета (1536x1024); центр збігається з намальованим колесом на плиті.
export const WHEEL_CENTER = { x: 950, y: 388.5 }
export const WHEEL_COVER_RADIUS = 203 // закриває намальоване колесо
export const WHEEL_VIEW_RADIUS = 226 // з запасом для підписів кутів ASC/MC за краєм колеса
export const WHEEL_RIM_RADIUS = 195
export const SIGN_RING_INNER_RADIUS = 160
export const SIGN_GLYPH_RADIUS = 177
export const PLANET_GLYPH_RADIUS = 141
export const PLANET_DEGREE_RADIUS = 122
export const ASPECT_RING_RADIUS = 108 // кінці ліній аспектів лежать на цьому колі
export const HOUSE_NUMBER_RADIUS = 96
export const ANGLE_LABEL_RADIUS = 211
export const PLANET_TICK_INNER_RADIUS = 156
export const CENTER_DOT_RADIUS = 3

export const SIGN_ARC_DEGREES = 30
export const FULL_CIRCLE_DEGREES = 360
export const LEFT_DEGREES = 180 // Асцендент — зліва (9 годин), зодіак іде проти годинникової стрілки
export const MIN_PLANET_GAP_DEGREES = 15
export const SPREAD_PASSES = 60
export const SPREAD_STEP_RATIO = 0.5
export const MINUTES_PER_DEGREE = 60

export const SIGN_GLYPH_SIZE = 22
export const PLANET_GLYPH_SIZE = 19
export const PLANET_DEGREE_SIZE = 10.5
export const HOUSE_NUMBER_SIZE = 10
export const ANGLE_LABEL_SIZE = 13

export const RETROGRADE_MARK = '℞'

// ︎ — текстовий варіант знака, щоб Windows не підставляла кольоровий емодзі
const TEXT_PRESENTATION = '︎'
export const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g) => g + TEXT_PRESENTATION)
export const PLANET_GLYPHS = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
}

export const WHEEL_COLORS = {
  cover: '#0a1524',
  inner: '#08111e',
  gold: '#e4be80',
  goldSoft: 'rgba(228, 190, 128, 0.45)',
  houseLine: 'rgba(228, 190, 128, 0.28)',
  planet: '#f3efe7',
  degree: '#b9a07a',
}

// Лінії аспектів: колір, пунктир і товщина за типом (див. server/src/astrology/report.ts); сполучення лінії не мають.
export const ASPECT_STYLES = {
  sextile: { color: '#6fb7d9', dash: '4 3' },
  trine: { color: '#7bd389', dash: '' },
  square: { color: '#e0645c', dash: '' },
  opposition: { color: '#e0645c', dash: '6 3' },
}
export const ASPECT_GLYPHS = { conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍' }
export const ASPECT_LABELS = { conjunction: 'Conjunction', sextile: 'Sextile', square: 'Square', trine: 'Trine', opposition: 'Opposition' }
export const ASPECT_MIN_OPACITY = 0.35
export const ASPECT_LINE_WIDTH = 1.4
