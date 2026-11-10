// Підстановка даних у тексти екрана. У JSON макета тексти лежать окремими рядками з координатами; «прив’язані» рядки
// (див. bindings.js) мають поле dyn — ключ значення. Абзац з кількох рядків (lines) переносимо за словами в ті самі рядки.

/** Перенос за словами: не більше `max` символів у рядку й не більше `lines` рядків (зайве — «…»). */
export function wrap(text, max, lines) {
  const out = []
  let line = ''
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (line && (line + ' ' + word).length > max) {
      out.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) out.push(line)
  if (out.length <= lines) return out
  const kept = out.slice(0, lines)
  kept[lines - 1] = `${kept[lines - 1].slice(0, Math.max(0, max - 1)).trimEnd()}…`
  return kept
}

/**
 * Збалансований перенос: найменша кількість рядків (до `lines`), при якій текст ділиться порівну, а рядок не довший за
 * `cap` символів (орієнтовно ширина місця / (кегль * 0,5)). Довгий текст бере більше рядків, короткий лишається в одному-двох,
 * тож кегль не доводиться різко зменшувати.
 */
export function balancedWrap(text, lines, cap = Infinity) {
  const s = String(text)
  for (let n = 1; n <= lines; n++) {
    const rows = wrap(s, Math.ceil(s.length / n) + 6, 99) // +6: слова не різатимемо, тож лишаємо запас
    if (rows.length <= n && Math.max(...rows.map((r) => r.length)) <= cap) return rows
  }
  return wrap(s, Math.ceil(s.length / lines) + 6, lines)
}

/**
 * Переклад може бути довшим за англійський оригінал, а рядки макета не переносяться: тоді трохи зменшуємо кегль,
 * щоб текст лишився в межах свого блоку. Запас — 10 % + 4 символи (короткі підписи майже завжди мають зайве місце),
 * але не менше ніж 70 % від початкового кегля.
 */
const MIN_SCALE = 0.7
const AVG_CHAR = 0.5 // середня ширина символу в частках кегля
const SIDEBAR_EDGE = 236 // права межа плашок бічної панелі (одиниці макета); підписи меню не мають за неї виходити
export function fit(t, s) {
  if (s === t.s) return t
  let scale = Math.max(MIN_SCALE, Math.min(1, (t.s.length * 1.1 + 4) / Math.max(1, s.length)))
  if (t.maxw && t.fs) scale = Math.min(scale, Math.max(MIN_SCALE, t.maxw / (s.length * t.fs * AVG_CHAR)))
  if (t.fs && t.x < 242) {
    const room = SIDEBAR_EDGE - t.x
    const est = s.length * t.fs * AVG_CHAR
    if (est > room) scale = Math.min(scale, Math.max(MIN_SCALE, room / est))
  }
  return { ...t, s, fs: scale < 1 && t.fs ? +(t.fs * scale).toFixed(2) : t.fs }
}

/**
 * Обмежує ширину статичних підписів тим, що праворуч у тому ж рядку: кнопкою (напр. довгий опис перед «Generate Report»)
 * або наступним текстом (напр. «Я погоджуюсь з» перед «Умовами використання»), а також правим краєм картки (клікабельної
 * зони), у якій текст стоїть (напр. «Стеж за своїм зростанням» у картці «Прогрес»). Текст має закінчуватись до початку
 * такого сусіда чи краю картки. Динамічні значення не чіпаємо: у них свій maxw із прив'язки.
 */
export function limitByNeighbours(texts, hits) {
  return texts.map((t) => {
    if (!t.fs || !t.lh) return t
    const sameRow = (y, h = 0) => y < t.y + t.lh && y + h > t.y
    const rooms = hits.filter((h) => h.x > t.x + 20 && sameRow(h.y, h.h)).map((h) => h.x - t.x - 10)
    if (t.dyn == null) {
      // картка, що містить початок тексту: правий край мінус відступ
      rooms.push(...hits.filter((h) => h.x <= t.x && t.x < h.x + h.w && sameRow(h.y, h.h)).map((h) => h.x + h.w - t.x - 12))
      // «той самий рядок» для тексту: центри по вертикалі близько (різниця менша за 0,6 висоти рядка)
      rooms.push(...texts.filter((o) => o !== t && o.x > t.x + 20 && Math.abs(o.y - t.y) < t.lh * 0.6).map((o) => o.x - t.x - 8))
    }
    return rooms.length ? { ...t, maxw: Math.min(...rooms) } : t
  })
}

/**
 * Динамічне значення (воно може бути довшим за макетне, напр. «Близнюки» замість «Cancer»): якщо в прив'язці задано
 * maxw (одиниць макета), стискаємо кегль так, щоб рядок (≈ 0.5 кегля на символ) не виходив за цю ширину;
 * без maxw — та сама евристика, що й для статичних підписів, відносно макетного тексту.
 */
export function fitValue(t, s) {
  if (!t.maxw) return fit(t, s)
  const est = s.length * (t.fs ?? 16) * AVG_CHAR
  const scale = Math.max(0.6, Math.min(1, t.maxw / Math.max(1, est)))
  return { ...t, s, fs: scale < 1 && t.fs ? +(t.fs * scale).toFixed(2) : t.fs }
}

/**
 * Бічне меню малює живий компонент (SideNav), тож намальовані на плиті підписи пунктів (тексти всередині плашок `nav`) не потрібні:
 * вони дублювали б меню й показували б застарілий перелік розділів.
 */
export const withoutNavTexts = (texts, hits) => {
  const navHits = hits.filter((h) => h.nav)
  return texts.filter((t) => !navHits.some((h) => t.x >= h.x && t.x < h.x + h.w && t.y >= h.y && t.y < h.y + h.h))
}

/**
 * Повертає нові тексти, де всі рядки з dyn заповнено значеннями з `values` (якщо значення немає — порожньо,
 * щоб макетні дані ніколи не потрапляли на екран).
 */
export function resolveTexts(texts, values, translate = (s) => s) {
  const out = []
  const placed = new Map() // ключ значення → куди воно стало, для підписів, що йдуть одразу за ним (after)
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i]
    if (t.dyn == null) {
      const next = fit(t, translate(t.s))
      const before = t.after && placed.get(t.after)
      out.push(before ? { ...next, x: +(before.x + textWidth(before.s, before.fs) + AFTER_GAP).toFixed(2) } : next)
    } else if (t.flow) {
      // один рядок макета, що може розтекстися на кілька рядків униз
      const text = values[t.dyn] ?? ''
      const cap = t.maxw && t.fs ? Math.floor(t.maxw / (t.fs * AVG_CHAR)) : Infinity
      const rows = t.balance ? balancedWrap(text, t.flow, cap) : wrap(text, t.width, t.flow)
      rows.forEach((row, k) => out.push({ ...t, dyn: undefined, balance: undefined, s: row, y: t.y + k * t.lh }))
    } else if (t.lines) {
      const rows = wrap(values[t.dyn] ?? '', t.width, t.lines)
      for (let j = 0; j < t.lines; j++) out.push({ ...texts[i + j], dyn: undefined, s: rows[j] ?? '' })
      i += t.lines - 1
    } else {
      const v = t.g ? { ...t, s: String(values[t.dyn] ?? '') } : fitValue(t, String(values[t.dyn] ?? '')) // групу підганяє сторінка
      // rx — правий край значення: довге слово росте вліво (до сусіднього підпису), а не на значок праворуч
      out.push({ ...v, ...(t.rx ? { x: t.rx, ralign: true } : {}), dyn: undefined })
      placed.set(t.dyn, out[out.length - 1])
    }
  }
  return out
}

// ширина цифр у частках кегля (шрифт із засічками): «1» вужча, крапка ще вужча; решта символів — як цифра
const EM = { '1': 0.37, '.': 0.23, ',': 0.23, ' ': 0.25 }
const textWidth = (s, fs = 16) => [...String(s)].reduce((sum, ch) => sum + (EM[ch] ?? 0.48), 0) * fs
const AFTER_GAP = 14 // відступ між значенням і підписом, що йде за ним (одиниці макета)

/**
 * Позначає рядки макета як динамічні. Запис специфікації:
 *   { find: 'Julia', key: 'user.name' }                  — рядок із цим текстом (nth — котрий за рахунком, 0 за замовчуванням)
 *   { find: 'Sun', offset: 1, key: 'planet.Sun' }         — рядок на offset позицій після знайденого
 *   { find: 'A time…', lines: 2, key: 'insight' }         — абзац із 2 рядків (переноситься за словами)
 *   { find: 'Short', flow: 2, width: 42, key: 'meaning' } — один рядок, що за потреби займе до 2 рядків
 *   { find: 'Cancer', key: 'sign', maxw: 56 }            — значення з обмеженням ширини (стискається, а не налазить на сусіда)
 *   { find: 'Cancer', key: 'sign', rx: 1426 }             — значення вирівняне по правому краю (x = rx)
 *   { find: 'Short', flow: 2, width: 46, fs: 18.5, lh: 23 } — те саме з меншим кеглем і висотою рядка (два рядки замість одного)
 *   { find: '/mo', after: 'price' }                      — статичний підпис одразу після значення price (x рахується за його шириною)
 *   { find: 'Hello', drop: 17 }                           — прибрати 17 рядків макета підряд (їх замінює живий компонент)
 */
export function bindTexts(texts, spec) {
  const out = texts.map((t) => ({ ...t }))
  const dropped = new Set()
  for (const { find, nth = 0, offset = 0, key, lines, flow, width, drop, maxw, rx, fs, lh, group, balance, after } of spec) {
    let seen = -1
    const at = texts.findIndex((t) => t.s === find && ++seen === nth)
    if (at < 0) throw new Error(`bindTexts: не знайдено «${find}» (nth ${nth})`)
    const i = at + offset
    if (drop) {
      for (let k = 0; k < drop; k++) dropped.add(i + k)
      continue
    }
    if (after) out[i].after = after
    if (key != null) out[i].dyn = key
    if (group) out[i].g = group // рядки однієї групи мають однаковий кегль: його підганяє сторінка (Screen.jsx)
    if (balance) out[i].balance = true // довжина рядка при переносі — порівну, а не «довгий рядок + огризок»
    if (fs) out[i].fs = fs // менший кегль і висота рядка, щоб довший текст вміщався у свій блок
    if (lh) out[i].lh = lh
    if (maxw) out[i].maxw = maxw
    if (rx) out[i].rx = rx
    if (lines) {
      out[i].lines = lines
      out[i].width = Math.max(...texts.slice(i, i + lines).map((t) => t.s.length))
    }
    if (flow) {
      out[i].flow = flow
      out[i].width = width ?? texts[i].s.length
      if (maxw) out[i].maxw = maxw
    }
  }
  return out.filter((_, i) => !dropped.has(i))
}
