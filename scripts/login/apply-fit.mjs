// Застосовує результати підбору (fit.mjs) і вирівнювання ваги (fit-mass.mjs) у src/login/login.css та login.html.
//   node scripts/login/apply-fit.mjs <results.json> [--family "Assistant"] [--mass]
//   --family  : примусово один шрифт для всіх блоків UI (беруться параметри цього шрифту з runnersUp/переможця; якщо
//               шрифту немає в результатах блоку — блок не чіпається);
//   --mass    : після підстановки накласти ваги й трекінг з node_modules/.cache/login-fit/mass.json.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--') && a.endsWith('.json'))
const fam = args.includes('--family') ? args[args.indexOf('--family') + 1] : null
const useMass = args.includes('--mass')
const results = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
const mass = useMass ? JSON.parse(fs.readFileSync(path.join(root, 'node_modules/.cache/login-fit/mass.json'), 'utf8')) : {}

// блок → CSS-правило і початок координат батька (як у fit.mjs); xdy — позиція по Y задається зсувом --dy
const MAP = {
  subtitle: { rule: '.subtitle', origin: [600, 62] },
  welcome: { rule: '.welcome', origin: [600, 62] },
  cardWord: { rule: '.card-word', origin: [600, 62] },
  sbWord: { rule: '.sb-word', origin: [0, 0] },
  navLabel: { rule: '.nav-label', origin: [46, 0], xdy: true },
  placeholder: { rule: '.input', origin: [657, 0], xdy: true },
  remember: { rule: '.remember-text', origin: [600, 62] },
  forgot: { rule: '.forgot', origin: [600, 62] },
  signText: { rule: '.btn-text', origin: [656, 651] },
  googleText: { rule: '.btn-google .btn-text', origin: [656, 784] },
  orText: { rule: '.or-text', origin: [600, 62] },
  footText: { rule: '.foot-text', origin: [600, 62] },
  footLink: { rule: '.foot-link', origin: [600, 62] },
}
const GENERIC = { sans: "sans-serif", serif: 'Georgia, serif' }
const cssPath = path.join(root, 'src/login/login.css')
let css = fs.readFileSync(cssPath, 'utf8')

function setProps(selector, props) {
  const start = css.indexOf('\n' + selector + ' {')
  if (start < 0) throw new Error('немає правила ' + selector)
  const end = css.indexOf('}', start)
  let body = css.slice(start, end)
  for (const [k, v] of Object.entries(props)) {
    const re = new RegExp(`\\n  ${k.replace(/[-]/g, '\\-')}: [^;]+;`)
    body = re.test(body) ? body.replace(re, `\n  ${k}: ${v};`) : body + `\n  ${k}: ${v};`
  }
  css = css.slice(0, start) + body + css.slice(end)
}
const num = (v) => +(+v).toFixed(3)

const used = new Set()
for (const [name, res] of Object.entries(results)) {
  const m = MAP[name]
  if (!m) continue
  let pick = { family: res.family, wght: res.wght, params: res.params }
  if (fam && res.family !== fam) {
    const alt = (res.runnersUp ?? []).find((r) => r.family === fam)
    if (!alt || !alt.params) { console.log(`пропуск ${name}: немає параметрів для "${fam}"`); continue }
    pick = alt
  }
  const p = pick.params
  const props = {
    '--fs': num(p.fs),
    '--ls': num(p.ls ?? 0),
    '--wght': Math.round(p.wght ?? pick.wght),
    'font-family': `'${pick.family}', ${GENERIC[['Gilda Display', 'Cardo', 'Spectral', 'Lora', 'Gelasio'].includes(pick.family) ? 'serif' : 'sans']}`,
  }
  if (p.x !== undefined) props['--x'] = num(p.x - m.origin[0])
  if (m.xdy) { if (p.dy !== undefined) props['--dy'] = num(p.dy) } else if (p.y !== undefined) props['--y'] = num(p.y - m.origin[1])
  const ms = mass[name]?.best
  if (ms) { props['--wght'] = ms.wght; props['--ls'] = num(ms.ls) }
  setProps(m.rule, props)
  used.add(pick.family)
  console.log(name.padEnd(12), pick.family, JSON.stringify(props))
}
fs.writeFileSync(cssPath, css)
console.log('шрифти:', [...used].join(', '))
