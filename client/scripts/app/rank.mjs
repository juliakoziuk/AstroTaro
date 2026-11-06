// Ранжування шрифтів за пропорціями рядків: відношення ширини чорнила до висоти (canvas.measureText) для кожного
// привʼязаного рядка порівнюється з виміряним на макеті. Не залежить від кегля, тому не «тяжіє» до тонких накреслень.
//   node scripts/app/rank.mjs [--write]     (--write — записати переможців у scripts/app/fonts.json)
import fs from 'node:fs'
import path from 'node:path'
import { SCREENS, root } from './common.mjs'
import { parseDsl } from './dsl.mjs'
import { styleOf } from './style.mjs'
import { openFontPage, measure } from './fontpage.mjs'

const SERIF = ['Cormorant Garamond', 'Cormorant', 'EB Garamond', 'Playfair Display', 'Lora', 'Crimson Pro', 'Crimson Text', 'Newsreader', 'Source Serif 4', 'Gelasio', 'Libre Baskerville', 'Noto Serif Display', 'Libre Caslon Text', 'Libre Caslon Display', 'Cardo', 'Spectral', 'Gilda Display', 'Prata', 'Bodoni Moda', 'DM Serif Display', 'DM Serif Text', 'Marcellus', 'Fraunces', 'Literata', 'Merriweather', 'PT Serif', 'Vollkorn', 'Alike', 'Rufina', 'Bellefair', 'Forum', 'Abhaya Libre', 'Sorts Mill Goudy', 'Libre Bodoni', 'Domine', 'Neuton', 'Alegreya', 'Gentium Book Plus', 'Old Standard TT', 'Frank Ruhl Libre', 'Roboto Serif', 'Noto Serif', 'STIX Two Text', 'Besley', 'Young Serif', 'Instrument Serif', 'Lusitana', 'Cambo', 'Judson', 'Quattrocento', 'Cormorant Upright', 'Cormorant Infant', 'Playfair Display SC', 'Trirong', 'Mate', 'Caudex', 'Linden Hill', 'Sura', 'Inknut Antiqua', 'Rosarivo', 'Kurale']
const SANS = ['Noto Sans', 'Open Sans', 'Lato', 'Mulish', 'Nunito Sans', 'Source Sans 3', 'Inter', 'Roboto', 'Encode Sans', 'Alegreya Sans', 'Jost', 'Cabin', 'Assistant', 'Catamaran', 'Hind', 'PT Sans', 'Fira Sans', 'Libre Franklin', 'Ubuntu', 'Oxygen', 'Overpass', 'Rubik', 'Barlow', 'Public Sans', 'Red Hat Text', 'Figtree', 'Outfit', 'Albert Sans', 'Be Vietnam Pro', 'Lexend', 'Sarabun', 'Heebo', 'Archivo', 'Proza Libre', 'Mukta', 'Asap', 'Signika', 'Maven Pro', 'Questrial', 'Titillium Web', 'Josefin Sans', 'Poppins', 'Gudea', 'Nobile', 'Istok Web', 'Carlito', 'Arimo', 'Tajawal', 'Noto Sans Display', 'Cantarell', 'Quattrocento Sans', 'Didact Gothic', 'Sen', 'Urbanist', 'Manrope', 'DM Sans', 'Work Sans', 'Karla', 'Raleway', 'Montserrat', 'Instrument Sans', 'Plus Jakarta Sans', 'Hanken Grotesk', 'Schibsted Grotesk', 'Onest', 'Golos Text', 'Commissioner', 'Wix Madefor Text', 'Geologica', 'Source Sans Pro', 'Ubuntu Sans', 'Sora', 'Mada', 'Varela', 'Varela Round', 'Nunito', 'Quicksand', 'M PLUS 1p', 'Lexend Deca']

const items = [] // {fam, text, ratio, wg}
const det = {}
for (const sc of SCREENS) {
  const f = path.join(root, `scripts/app/specs/${sc.id}.mjs`)
  if (!fs.existsSync(f)) continue
  const dsl = parseDsl((await import(`./specs/${sc.id}.mjs`)).default.dsl)
  det[sc.id] = JSON.parse(fs.readFileSync(path.join(root, `scripts/app/detections/${sc.id}.json`), 'utf8'))
  const add = (idx, cls, text, ov = {}) => {
    const st = styleOf(cls)
    if (st.fit === 'h' || [...text].length < 2) return
    const d = det[sc.id][idx]
    if (!d || ov.x0 || ov.x1 || ov.y0 || ov.y1) return // обрізані рядки — без перерахунку, тут не потрібні
    items.push({ fam: st.fam, text, ratio: d.w / d.h, wg: st.wg, cls })
  }
  for (const t of dsl.texts) add(t.idx, t.cls, t.text, t.opts)
  for (const s of dsl.selects) add(s.idx, s.cls, s.options[0])
  for (const s of dsl.inputs) add(s.idx, s.cls, s.placeholder)
}
console.log('рядків для ранжування:', items.length, '(serif', items.filter((i) => i.fam === 'serif').length + ', sans', items.filter((i) => i.fam === 'sans').length + ')')

const results = { serif: [], sans: [] }
const { browser, page, loaded } = await openFontPage([...SERIF, ...SANS].map((family) => ({ family })))
try {
  for (const fam of ['serif', 'sans']) {
    const cands = (fam === 'serif' ? SERIF : SANS).map((name) => loaded.find((l) => l.family === name)).filter(Boolean)
    const mine = items.filter((i) => i.fam === fam)
    for (const c of cands) {
      const avail = c.loaded.split(';').map(Number)
      const jobs = mine.map((i) => ({ family: c.family, wg: avail.reduce((a, b) => (Math.abs(b - i.wg) < Math.abs(a - i.wg) ? b : a)), s: i.text }))
      const met = await measure(page, jobs)
      let err = 0
      let n = 0
      const per = []
      met.forEach((m, k) => {
        if (!m.ok || !m.W) return
        const r = m.W / (m.A + m.D) / mine[k].ratio
        err += Math.abs(Math.log(r))
        n++
        per.push(+r.toFixed(2))
      })
      if (n < mine.length * 0.9) continue
      results[fam].push({ family: c.family, weights: avail, err: err / n })
    }
    results[fam].sort((a, b) => a.err - b.err)
    console.log(`\n== ${fam}: найближчі за пропорціями (середня |ln|; 0 = ідеально)`)
    for (const r of results[fam].slice(0, 12)) console.log(' ', r.family.padEnd(22), r.err.toFixed(3), 'ваги', r.weights.join('/'))
  }
} finally {
  await browser.close()
}
if (process.argv.includes('--write')) {
  const out = {}
  for (const fam of ['serif', 'sans']) {
    const best = results[fam][0]
    out[fam] = { family: best.family, weights: best.weights }
  }
  fs.writeFileSync(path.join(root, 'scripts/app/fonts.json'), JSON.stringify(out, null, 2) + '\n')
  console.log('\nзаписано в fonts.json:', JSON.stringify(out))
}
