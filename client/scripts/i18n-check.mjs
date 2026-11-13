// Перевірка повноти перекладів (npm run i18n:check; друк ключів, яких бракує: npm run i18n:check -- --list).
// Збирає всі англійські рядки інтерфейсу: назви екранів, усі літерали в викликах t(...) і ключі, які складаються динамічно (див. DYNAMIC).
// Порівнює зі словниками src/i18n/uk.js; виходить із кодом 1, якщо чогось бракує або словник має зайві ключі.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LIST = process.argv.includes('--list')

// ключі, що збираються в коді динамічно (t(variable)), тож у літералах їх не видно
const DYNAMIC = [
  'Good morning,', 'Good afternoon,', 'Good evening,', 'Good night,', // привітання дашборда
  'Yes', 'No', 'Not yet', // відповідь розкладу «Так/Ні» в історії
  'Tarot', 'Dream Journal', 'Astrology', // функції лендінга
  'Save', 'Add dream', // підписи кнопок модалок
  'Conjunction', 'Sextile', 'Square', 'Trine', 'Opposition', // типи аспектів у діалозі натальної карти (ASPECT_LABELS)
  'Today', 'Week', 'Month', // вкладки прогнозу (TABS у Forecast.jsx)
  'Billing', 'Free', 'Pro', 'Premium', // вкладка й назви тарифів (BillingPanel.jsx, settings-panel.jsx)
  'Quick readings', 'Detailed readings', 'Depth readings', 'Forecast for today', 'Forecast for the week', 'Forecast for the month', // MODE_NAMES і RANGE_NAMES у BillingPanel.jsx
  'Harmonious', 'Tense', 'Mixed', // оцінка сумісності (effectOf у CompatibilityDialog.jsx)
  // вибір інтересів у знайомстві (INTERESTS в Onboarding.jsx)
  'Self-reflection', 'Readings that answer your questions', 'A journal that finds the symbols', 'Your chart and the sky today', 'Notes, moods and your own patterns',
  // підписи відповідей «Збулося?» (ANSWER_TEXT в History.jsx)
  'Partly came true', 'Did not come true',
  // підписи екранів застосунку, що беруться з масивів і викликаються як t(змінна): меню (nav.js), плитки дашборда, режими й меню екранів Tarot/Astrology, вкладки й теми налаштувань
  'Analytics', 'Help', 'Get a reading', 'Log a dream', 'Explore your chart', 'Journal', 'Write and reflect', 'Progress', 'Track your growth', 'Tarot readings', 'Dreams logged', 'Journal entries', 'Detailed', 'In depth', 'Your cosmic blueprint', 'Transits', 'Current planetary influences', 'Relationship analysis', 'Daily Forecast', 'Personal astro guidance', 'Astro Calendar', 'Important cosmic dates', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'General', 'Appearance', 'Privacy & Security', 'Data & Storage', 'About', '24-hour', '12-hour', 'Dark', 'Light', 'Auto',
  // перший аргумент t() розбирається по ", {", а в цьому тексті власні «, {x}», тож літерал у коді не видно
  'Based on all {n} aspects between your charts: {h} harmonious, {x} tense.',
]
// однакові в усіх мовах: окремого перекладу не потребують
const SAME = new Set(['MYSTIQ', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'LOSTIQ', '$0', '$9.99', '$19.99', 'Pro', 'Premium'])

// екрани імпортують роутер і тему, яким потрібне вікно браузера: для збору назв екранів досить заглушки
globalThis.window = globalThis
globalThis.history = { state: null, replaceState() {} }
globalThis.addEventListener = () => {}
globalThis.location = { hash: '', search: '' }
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }

const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { SCREENS } = await server.ssrLoadModule('/src/app/screens.js')
const dicts = { uk: (await server.ssrLoadModule('/src/i18n/uk.js')).default }
await server.close()

const found = new Map() // ключ → де знайдено
const add = (key, where) => {
  const k = key.replace(/\s+/g, ' ').trim()
  if (!k || SAME.has(k) || /^[\d\s:/%.,$+-]+$/.test(k)) return
  if (!found.has(k)) found.set(k, where)
}

for (const sc of SCREENS) {
  add(sc.name, `screen:${sc.id}`)
  add(sc.title, `screen:${sc.id}`)
  const d = sc.data
  if (!d) continue
  // рядки абзацу (lines) підставляються цілим текстом, тож окремого перекладу не потребують
  for (let i = 0; i < d.texts.length; i++) {
    const t = d.texts[i]
    if (t.dyn != null) i += (t.lines ?? 1) - 1
    else add(t.s, `layout:${sc.id}`)
  }
  for (const s of d.selects ?? []) if (s.id !== 'lang') s.options.forEach((o) => add(o, `option:${sc.id}`))
  for (const i of d.inputs ?? []) add(i.placeholder, `placeholder:${sc.id}`)
  for (const h of d.hits ?? []) if (sc.live?.hitLabel?.(h.label, {}) === undefined) add(h.label, `hit:${sc.id}`)
}
DYNAMIC.forEach((k) => add(k, 'dynamic'))

// літерали всередині t(...) і label="..." у вихідному коді
const SKIP = ['src/i18n', 'src/app/data']
const files = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    const rel = path.relative(root, p).replaceAll('\\', '/')
    if (SKIP.some((s) => rel.startsWith(s))) continue
    if (e.isDirectory()) walk(p)
    else if (/\.(jsx?|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p)
  }
}
walk(path.join(root, 'src'))

const unescape = (s) => s.replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(['"`\\])/g, '$1')
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const rel = path.relative(root, file).replaceAll('\\', '/')
  for (const m of src.matchAll(/(?<![\w.$])t\(/g)) {
    let depth = 1
    let i = m.index + m[0].length
    const start = i
    for (; i < src.length && depth > 0; i++) depth += src[i] === '(' ? 1 : src[i] === ')' ? -1 : 0
    const args = src.slice(start, i - 1)
    // перший аргумент — рядок (або умова з двох рядків); решту (змінні в {vars}) не чіпаємо
    const first = args.split(/,\s*\{/)[0]
    for (const lit of first.matchAll(/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\])*)`/g)) add(unescape(lit[1] ?? lit[2] ?? lit[3]), rel)
  }
  for (const m of src.matchAll(/\blabel="([^"]+)"/g)) add(unescape(m[1]), `${rel} (label)`)
}

let bad = false
for (const [lang, dict] of Object.entries(dicts)) {
  const missing = [...found.keys()].filter((k) => !(k in dict))
  const unused = Object.keys(dict).filter((k) => !found.has(k))
  console.log(`${lang}: ${found.size - missing.length}/${found.size} перекладено, бракує ${missing.length}, зайвих ключів ${unused.length}`)
  if (LIST || missing.length) {
    missing.forEach((k) => console.log(`  - ${JSON.stringify(k)}   (${found.get(k)})`))
    unused.forEach((k) => console.log(`  ? зайвий ключ ${JSON.stringify(k)}`))
  }
  bad ||= missing.length > 0 || unused.length > 0
}
process.exit(bad ? 1 : 0)
