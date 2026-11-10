// Збірка корпусу тлумачень із книг у суспільному надбанні: node scripts/build-astro-corpus.mjs
// Читає data/astrology-sources/*/source.txt (розпізнаний текст archive.org), вибирає розділи про конкретні положення й пише
// data/astrology-corpus/*.json. Розпізнавання кривувате, тож назви шукаються з допуском на помилки. Друкує, що саме покрито.
//   · Astrology for All (1899): розділи за заголовками «THE SUN IN ARIES» і «THE SUN IN ARIES AND MOON IN TAURUS» (усі 144 пари)
//   · The Key to Your Own Nativity (1920): абзаци «Planet in Sign», «Planet in the Nth House» і аспекти планети до планети
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data')
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth']
const NOT_A_PLACEMENT = /\b(ruler|rules|ruling|exalted|exaltation|fall|detriment|significator|rulership)\b/i
const IN_WORDS = new Set(['in', 'is', 'xv', 'tv', 'iv', 'm', 'ih', 'ln', 'iw', 'at', 'inthe', 'ofthe'])

const SOURCES = [
  { dir: 'astrology-for-all-1899', id: 'leo-afa-1899', title: 'Alan Leo, Astrology for All', year: 1899, parse: parseAstrologyForAll },
  { dir: 'key-to-your-own-nativity', id: 'leo-key-1920', title: 'Alan Leo, The Key to Your Own Nativity', year: 1920, parse: parseKey },
]

// ---------- допуск на помилки розпізнавання ----------
/** Відстань Левенштейна: розпізнавання плутає літери («Mercurv», «Satum»). */
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

const letters = (w) => w.toLowerCase().replace(/[^a-z]/g, '')

/** Назва зі списку, якщо слово на неї схоже: допуск залежить від довжини (короткі слова лише точні). */
function match(word, names) {
  const w = letters(word)
  if (w.length < 3) return null
  let best = null
  for (const name of names) {
    const n = name.toLowerCase()
    const allowed = n.length <= 4 ? 0 : n.length <= 5 ? 1 : n.length <= 8 ? 2 : 3
    const d = distance(w, n)
    if (d <= allowed && (!best || d < best.d)) best = { name, d }
  }
  return best?.name ?? null
}

/** Назва серед слів, також із розірваним словом («Ge mini»): пробуємо слово і злите з наступним. */
function find(words, names, from, to) {
  for (let k = from; k < Math.min(to, words.length); k++) {
    const one = match(words[k], names)
    if (one) return { name: one, at: k }
    const joined = words[k + 1] ? match(words[k] + words[k + 1], names) : null
    if (joined) return { name: joined, at: k + 1 }
  }
  return null
}

const clean = (s) => s.replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').replace(/(\w)- (\w)/g, '$1$2').trim()
const countWords = (s) => s.split(' ').length

// ---------- Astrology for All: розділи за заголовками ----------
const isUpperHeading = (line) => {
  const l = line.replace(/\s+/g, ' ').trim()
  if (l.length < 8 || l.length > 90) return false
  const letterCount = (l.match(/[A-Za-z]/g) ?? []).length
  const upper = (l.match(/[A-Z]/g) ?? []).length
  return letterCount >= 8 && upper / letterCount > 0.85 && l.split(' ').length >= 3
}

/** «THE SUN IN ARIES» або «THE SUN IN ARIES AND MOON IN TAURUS»: планета, знак (і друга пара). */
function afaHeading(line) {
  const toks = line.replace(/\s+/g, ' ').trim().split(' ')
  if (!/^th[eb]$/i.test(letters(toks[0]))) return null
  const placements = []
  let from = 1
  while (from < toks.length) {
    const planet = find(toks, PLANETS, from, toks.length)
    if (!planet) break
    const sign = find(toks, SIGNS, planet.at + 1, planet.at + 4)
    if (!sign) break
    placements.push({ planet: planet.name, sign: sign.name })
    from = sign.at + 1
  }
  return placements.length ? placements : null
}

function parseAstrologyForAll(lines) {
  const out = []
  const headings = lines.map((l, i) => ({ i, p: isUpperHeading(l) ? afaHeading(l) : null })).filter((h) => h.p)
  const boundaries = lines.map((_, i) => i).filter((i) => isUpperHeading(lines[i]) || /^\s*CHAPTER\s+[IVXLC]+/i.test(lines[i]))
  for (const h of headings) {
    const next = boundaries.find((b) => b > h.i) ?? lines.length
    const body = clean(
      lines
        .slice(h.i + 1, next)
        .filter((l) => l.trim().length > 5 && !/^[\sIVXivx0-9.,*\-—()]+$/.test(l)) // номери розділів і сміття
        .join(' '),
    )
    if (countWords(body) < 40) continue
    const [a, b] = h.p
    out.push({ kind: b ? 'combo' : 'sign', planet: a.planet, sign: a.sign, ...(b ? { planet2: b.planet, sign2: b.sign } : {}), line: h.i + 1, text: body.split(' ').slice(0, 700).join(' ') })
  }
  return out
}

// ---------- The Key to Your Own Nativity: абзаци ----------
const NATURES = [
  ['conjunction', 'conjunction'],
  ['benefic', 'benefic'],
  ['adverse', 'adverse'],
]

/** Абзац починається з планети: «Sun in Cancer…», «Uranus in the First House…», «The Moon and Venus were in BENEFIC aspect…». */
function keyHeading(text) {
  const toks = text.replace(/^[^A-Za-z]+/, '').split(/\s+/).slice(0, 16)
  let at = -1
  let planet = null
  for (let k = 0; k < Math.min(4, toks.length) && !planet; k++) {
    const found = match(toks[k], PLANETS)
    if (found) [planet, at] = [found, k]
  }
  if (!planet) return null
  const window = toks.slice(at + 1, at + 8)
  if (NOT_A_PLACEMENT.test(window.join(' '))) return null
  const joiner = window.slice(0, 4).some((w) => IN_WORDS.has(letters(w)))
  const ordinal = find(window, ORDINALS, 0, 6)
  if (ordinal && window.slice(ordinal.at + 1, ordinal.at + 3).some((w) => match(w, ['House']))) return { kind: 'house', planet, house: ORDINALS.indexOf(ordinal.name) + 1, exact: joiner }
  // аспект планети до планети: у вікні друга планета й слово conjunction / benefic / adverse
  const other = find(window, PLANETS.filter((p) => p !== planet), 0, 7)
  const nature = NATURES.find(([, key]) => window.some((w) => letters(w) === key || match(w, [key])))
  if (other && nature) return { kind: 'aspect', planet, with: other.name, nature: nature[0], exact: joiner }
  const sign = find(window, SIGNS, 0, 6)
  return sign ? { kind: 'sign', planet, sign: sign.name, exact: joiner } : null
}

function parseKey(lines) {
  const paragraphs = []
  let buffer = []
  let start = 0
  const flush = () => {
    if (buffer.length) paragraphs.push({ line: start + 1, text: clean(buffer.join(' ')) })
    buffer = []
  }
  lines.forEach((line, i) => {
    if (!line.trim()) return flush()
    if (!buffer.length) start = i
    buffer.push(line.trim())
  })
  flush()
  const out = []
  for (const p of paragraphs) {
    const h = p.text.length >= 120 ? keyHeading(p.text) : null
    if (h) out.push({ kind: h.kind, planet: h.planet, ...(h.sign ? { sign: h.sign } : {}), ...(h.house ? { house: h.house } : {}), ...(h.with ? { with: h.with, nature: h.nature } : {}), match: h.exact ? 'heading' : 'fuzzy', line: p.line, text: p.text })
  }
  return out
}

// ---------- збирання й звіт ----------
function report(passages) {
  const kinds = {}
  for (const p of passages) kinds[p.kind] = (kinds[p.kind] ?? 0) + 1
  console.log('  by kind:', JSON.stringify(kinds))
  const signs = passages.filter((p) => p.kind === 'sign')
  if (signs.length) {
    console.log('  planet in sign (number of passages; . = none)')
    console.log('              ' + SIGNS.map((s) => s.slice(0, 3).padEnd(4)).join(''))
    for (const planet of PLANETS) console.log('  ' + planet.padEnd(10) + SIGNS.map((sign) => String(signs.filter((p) => p.planet === planet && p.sign === sign).length || '.').padEnd(4)).join(''))
  }
  const combos = passages.filter((p) => p.kind === 'combo')
  if (combos.length) {
    const have = new Set(combos.map((p) => `${p.sign}|${p.sign2}`))
    const missing = SIGNS.flatMap((a) => SIGNS.map((b) => [a, b])).filter(([a, b]) => !have.has(`${a}|${b}`))
    console.log(`  Sun-sign x Moon-sign pairs: ${have.size} of 144; missing: ${missing.map(([a, b]) => `${a.slice(0, 3)}/${b.slice(0, 3)}`).join(' ') || 'none'}`)
  }
  const houses = passages.filter((p) => p.kind === 'house')
  if (houses.length) console.log('  planet in house:', [...new Set(houses.map((p) => p.planet))].map((pl) => `${pl} ${houses.filter((p) => p.planet === pl).length}`).join(', '))
  const aspects = passages.filter((p) => p.kind === 'aspect')
  if (aspects.length) console.log('  aspects by planet:', [...new Set(aspects.map((p) => p.planet))].map((pl) => `${pl} ${aspects.filter((p) => p.planet === pl).length}`).join(', '))
}

mkdirSync(path.join(root, 'astrology-corpus'), { recursive: true })
for (const source of SOURCES) {
  const file = path.join(root, 'astrology-sources', source.dir, 'source.txt')
  if (!existsSync(file)) {
    console.log(`\n${source.id}: skipped, no ${file}`)
    continue
  }
  const lines = readFileSync(file, 'utf8').split('\n')
  const passages = source.parse(lines).map((p, i) => ({ id: `${source.id}:${i + 1}`, source: source.id, title: source.title, year: source.year, ...p, words: countWords(p.text) }))
  writeFileSync(path.join(root, 'astrology-corpus', `${source.id}.json`), JSON.stringify(passages, null, 1))
  console.log(`\n${source.title} (${source.year}): ${passages.length} passages, ${passages.reduce((n, p) => n + p.words, 0)} words`)
  report(passages)
}
