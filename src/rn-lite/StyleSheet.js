// Симулятор React Native (навчальний): стилі.
// Перетворює RN-стилі на веб-стилі й ламається там, де справжній RN теж не прийняв би стиль.

const NUMERIC_KEYS = new Set([
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingHorizontal', 'paddingVertical',
  'top', 'left', 'right', 'bottom', 'gap', 'rowGap', 'columnGap',
  'fontSize', 'lineHeight', 'letterSpacing',
  'borderWidth', 'borderRadius', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth',
  'flexBasis',
])

const NOT_IN_RN = {
  border: 'borderWidth + borderColor',
  background: 'backgroundColor',
  font: 'fontSize, fontFamily, fontWeight',
  boxShadow: 'shadowColor / shadowOffset / elevation',
  cursor: '(такої властивості немає)',
  display: "(у RN лише 'flex' або 'none')",
}

export function flatten(style) {
  if (!style) return {}
  if (Array.isArray(style)) return style.reduce((acc, s) => ({ ...acc, ...flatten(s) }), {})
  return style
}

function px(value) {
  return typeof value === 'number' ? value : value
}

// Повертає об'єкт стилів для DOM
export function normalizeStyle(style) {
  const flat = flatten(style)
  const out = {}
  for (const [key, value] of Object.entries(flat)) {
    if (value === undefined || value === null) continue

    if (key === 'display' && value !== 'flex' && value !== 'none') {
      throw new Error(`[симулятор RN] display: '${value}' — у React Native доступні лише 'flex' і 'none'.`)
    }
    if (key in NOT_IN_RN && key !== 'display') {
      throw new Error(`[симулятор RN] Властивості '${key}' немає в React Native. Використовуй: ${NOT_IN_RN[key]}.`)
    }
    if (NUMERIC_KEYS.has(key) && typeof value === 'string' && !/^-?\d+(\.\d+)?%$/.test(value) && value !== 'auto') {
      throw new Error(
        `[симулятор RN] Недопустиме значення стилю ${key}: '${value}'. У React Native розміри — числа (без px) або відсотки ('50%'). Справжній RN у такому випадку ігнорує стиль або показує помилку.`,
      )
    }

    switch (key) {
      case 'paddingHorizontal':
        out.paddingLeft = out.paddingRight = px(value)
        break
      case 'paddingVertical':
        out.paddingTop = out.paddingBottom = px(value)
        break
      case 'marginHorizontal':
        out.marginLeft = out.marginRight = px(value)
        break
      case 'marginVertical':
        out.marginTop = out.marginBottom = px(value)
        break
      case 'elevation':
      case 'shadowColor':
      case 'shadowOffset':
      case 'shadowOpacity':
      case 'shadowRadius':
      case 'textAlignVertical':
      case 'resizeMode':
        break
      default:
        out[key] = value
    }
  }
  return out
}

export const StyleSheet = {
  create: (styles) => styles,
  flatten,
  hairlineWidth: 1,
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
}
