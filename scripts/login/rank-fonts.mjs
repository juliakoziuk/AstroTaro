// Ранжування шрифтів інтерфейсу за ПРОПОРЦІЯМИ рядків: відношення ширини чорнильної рамки до її висоти
// (canvas.measureText: actualBoundingBox*) для кожного рядка порівнюється з виміряним у референсі.
// Не залежить від кегля й розмиття, тому не «тяжіє» до тонких накреслень, як піксельна різниця.
//   node scripts/login/rank-fonts.mjs [--weights 400,600]
import { launch } from '../landing-diff.mjs'

// [рядок, ширина, висота] — чорнильна рамка в референсі (одиниці = px), див. scripts/measure-login.mjs
const STRINGS = [
  ['Sign in to continue your journey', 341, 24],
  ['Email address', 140, 19],
  ['Password', 95, 19],
  ['Remember me', 116, 15],
  ['Forgot password?', 139, 19],
  ['Continue with Google', 195, 21],
  ['Don’t have an account?', 196, 16],
  ['Sign Up', 68, 20],
  ['Analytics', 76, 20],
  ['Settings', 68, 20],
  ['Access', 57, 15],
  ['Help', 38, 21],
  ['Chat', 39, 15],
  ['Home', 50, 15],
]
const FAMILIES = [
  'Lato', 'Nunito Sans', 'Open Sans', 'Mulish', 'Source Sans 3', 'Raleway', 'Montserrat', 'Jost', 'Cabin', 'Work Sans',
  'Karla', 'Inter', 'Noto Sans', 'DM Sans', 'Manrope', 'Hind', 'PT Sans', 'Fira Sans', 'Libre Franklin', 'Ubuntu',
  'Oxygen', 'Catamaran', 'Overpass', 'Rubik', 'Roboto', 'Barlow', 'Assistant', 'Encode Sans', 'IBM Plex Sans',
  'Red Hat Text', 'Public Sans', 'Figtree', 'Outfit', 'Albert Sans', 'Be Vietnam Pro', 'Commissioner', 'Lexend',
  'Sarabun', 'Heebo', 'Archivo', 'Alegreya Sans', 'Proza Libre', 'Mukta', 'Asap', 'Signika', 'Maven Pro',
  'Questrial', 'Titillium Web', 'Josefin Sans', 'Poppins', 'Gudea', 'Nobile', 'Istok Web', 'Carlito', 'Arimo', 'Tajawal',
  'Noto Sans Display', 'Source Sans Pro', 'Cantarell', 'Droid Sans', 'Quattrocento Sans', 'Didact Gothic', 'Sen', 'Urbanist',
]
const wIdx = process.argv.indexOf('--weights')
const WEIGHTS = (wIdx > 0 ? process.argv[wIdx + 1] : '400,700').split(',').map(Number)

const browser = await launch()
const page = await browser.newPage()
await page.goto('about:blank')
const loaded = []
const failed = []
for (const fam of FAMILIES) {
  const q = `${fam.replace(/ /g, '+')}:wght@${WEIGHTS.join(';')}`
  const ok = await page.evaluate(async (href) => {
    try {
      const r = await fetch(href)
      if (!r.ok) return false
      const css = await r.text()
      const st = document.createElement('style')
      st.textContent = css
      document.head.appendChild(st)
      return true
    } catch { return false }
  }, `https://fonts.googleapis.com/css2?family=${q}&display=swap`)
  ;(ok ? loaded : failed).push(fam)
}
await page.evaluate(async (list) => {
  await Promise.all(list.map(([f, w]) => document.fonts.load(`${w} 40px "${f}"`).catch(() => [])))
  await document.fonts.ready
}, loaded.flatMap((f) => WEIGHTS.map((w) => [f, w])))
if (failed.length) console.log('не завантажились:', failed.join(', '))

const rows = await page.evaluate(({ STRINGS, loaded, WEIGHTS }) => {
  const ctx = document.createElement('canvas').getContext('2d')
  const out = []
  for (const fam of loaded) for (const w of WEIGHTS) {
    ctx.font = `${w} 100px "${fam}"`
    if (!document.fonts.check(`${w} 100px "${fam}"`)) continue
    let err = 0
    const per = []
    for (const [s, W, H] of STRINGS) {
      const m = ctx.measureText(s)
      const iw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
      const ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
      const e = Math.log(iw / ih / (W / H))
      err += Math.abs(e)
      per.push(+(iw / ih / (W / H)).toFixed(2))
    }
    out.push({ fam, w, err: err / STRINGS.length, per })
  }
  return out
}, { STRINGS, loaded, WEIGHTS })
rows.sort((a, b) => a.err - b.err)
console.log('Найближчі за пропорціями (середня |ln(відношення)|; 0 = ідеально):')
for (const r of rows.slice(0, 16)) console.log(r.fam.padEnd(20), String(r.w).padEnd(4), r.err.toFixed(3), '| співвідношення по рядках:', r.per.join(' '))
console.log('\nПорівняння: Noto Sans', rows.filter((r) => r.fam === 'Noto Sans').map((r) => `${r.w}:${r.err.toFixed(3)}`).join(' '))
await browser.close()
