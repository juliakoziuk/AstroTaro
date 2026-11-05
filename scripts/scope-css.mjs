// Однократне «огортання» CSS у префікс-клас, щоб кілька екранів жили в одному SPA без конфліктів імен (.page, .stage, .t …).
//   node scripts/scope-css.mjs <файл.css> <клас-обгортки>      напр.  node scripts/scope-css.mjs src/landing/landing.css v-landing
// Правила:
//   :root           → .v-x           (змінні екрана)
//   body            → .v-x           (шрифт/колір екрана)
//   html, body, *   → видаляються    (глобальне — у src/app/base.css)
//   усе інше        → ".v-x <селектор>" (також усередині @media / @supports)
// Скрипт ідемпотентний: правила, що вже починаються з ".v-x", не чіпає.
import fs from 'node:fs'
import postcss from 'postcss'

const [file, scope] = process.argv.slice(2)
if (!file || !scope) throw new Error('використання: node scripts/scope-css.mjs <файл.css> <клас-обгортки>')
const S = '.' + scope
const root = postcss.parse(fs.readFileSync(file, 'utf8'))
let changed = 0
let dropped = 0

root.walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return
  const sels = rule.selectors.map((s) => s.trim())
  const global = (s) => s === 'html' || s === 'body' || s === '*'
  if (sels.every(global)) {
    if (sels.length === 1 && sels[0] === 'body') {
      rule.selectors = [S]
      changed++
    } else {
      rule.remove()
      dropped++
    }
    return
  }
  rule.selectors = sels.map((s) => {
    if (s === ':root') return S
    if (s === S || s.startsWith(S + ' ') || s.startsWith(S + '.') || s.startsWith(S + ':')) return s
    changed++
    return `${S} ${s}`
  })
})

fs.writeFileSync(file, root.toString())
console.log(`${file}: префіксовано ${changed} селекторів, видалено глобальних правил ${dropped}`)
