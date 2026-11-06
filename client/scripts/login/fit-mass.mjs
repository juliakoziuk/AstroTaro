// Вирівнювання ваги тексту за «масою чорнила»: сумою яскравості штрихів над фоном (з порогом, щоб не рахувати зерно).
// Підбір за піксельною різницею «боїться» розбіжності форм літер і тому схиляється до тонких, тьмяних накреслень;
// маса чорнила від форм літер майже не залежить, тож вага, що її збігає з референсом, виглядає правильною.
// Для кожної ваги ширина рядка тримається сталою (трекінг підлаштовується), щоб не зсувати розкладку.
//   node scripts/login/fit-mass.mjs [блок ...]   → node_modules/.cache/login-fit/mass.json
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../landing-diff.mjs'
import { W, H, loadReference } from './diff.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'node_modules/.cache/login-fit')
const URL = process.env.URL || 'http://localhost:5173/app.html?clean=1#/login'
const want = process.argv.slice(2)

// [селектор, зона, полярність, тип]; тип 'placeholder' — текст у ::placeholder
const BLOCKS = {
  subtitle: { sel: '.subtitle', zone: [742, 352, 366, 42], pol: 'light' },
  navLabel: { sel: '.nav-item:not(.is-active) .nav-label', zone: [120, 320, 100, 300], pol: 'light' },
  placeholder: { sel: '.input', zone: [730, 432, 180, 130], pol: 'light', placeholder: true },
  remember: { sel: '.remember-text', zone: [692, 592, 130, 30], pol: 'light' },
  forgot: { sel: '.forgot', zone: [1046, 592, 156, 32], pol: 'light' },
  signText: { sel: '.btn-sign .btn-text', zone: [900, 668, 100, 36], pol: 'dark' },
  googleText: { sel: '.btn-google .btn-text', zone: [846, 800, 215, 34], pol: 'light' },
  orText: { sel: '.or-text', zone: [910, 740, 32, 26], pol: 'light' },
  footText: { sel: '.foot-text', zone: [776, 868, 206, 30], pol: 'light' },
  footLink: { sel: '.foot-link', zone: [988, 868, 80, 32], pol: 'light' },
}
const WEIGHTS = [300, 325, 350, 375, 400, 425, 450, 475, 500, 550, 600, 650, 700]
const THR = 10 // піксель рахується, якщо відхилення від фону більше за поріг (відсікає зерно)

const ref = await loadReference()
const browser = await launch()
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 120000 })
await page.evaluate(async () => {
  await document.fonts.ready
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
})

const grey = (rgb) => {
  const g = new Float32Array(rgb.length / 3)
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2]
  return g
}
const shot = async (zone) => {
  const [x, y, w, h] = zone
  const png = await page.screenshot({ clip: { x, y, width: w, height: h }, type: 'png', optimizeForSpeed: true })
  return grey(await sharp(png).removeAlpha().raw().toBuffer())
}
const mass = (img, base, pol) => {
  let m = 0
  for (let i = 0; i < img.length; i++) {
    const d = pol === 'light' ? img[i] - base[i] : base[i] - img[i]
    if (d > THR) m += d
  }
  return m
}

/** Ширина тексту елемента в px (layout-ширина рядка; для плейсхолдера — через прихований span із тим самим шрифтом). */
const measure = (sel, placeholder) =>
  page.evaluate(({ sel, placeholder }) => {
    const el = document.querySelector(sel)
    if (placeholder) {
      const cs = getComputedStyle(el)
      const c = document.createElement('span')
      c.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font};letter-spacing:${cs.letterSpacing}`
      c.textContent = el.placeholder
      document.body.appendChild(c)
      const r = c.getBoundingClientRect().width
      c.remove()
      return r
    }
    const r = document.createRange()
    r.selectNodeContents(el)
    return r.getBoundingClientRect().width
  }, { sel, placeholder })

const refGrey = (zone) => {
  const [x, y, w, h] = zone
  return sharp(ref, { raw: { width: W, height: H, channels: 3 } }).extract({ left: x, top: y, width: w, height: h }).removeAlpha().raw().toBuffer().then(grey)
}

const out = {}
for (const [name, b] of Object.entries(BLOCKS)) {
  if (want.length && !want.includes(name)) continue
  // стартові значення з CSS
  const start = await page.evaluate(({ sel }) => {
    const el = document.querySelector(sel)
    const cs = getComputedStyle(el)
    return { wght: cs.getPropertyValue('--wght').trim(), ls: cs.getPropertyValue('--ls').trim(), u: parseFloat(getComputedStyle(document.querySelector('.page')).getPropertyValue('--u')) || 1 }
  }, { sel: b.sel })
  const ls0 = parseFloat(start.ls) || 0
  const setCss = (wght, ls) =>
    page.evaluate(({ sel, wght, ls }) => document.querySelectorAll(sel).forEach((el) => { el.style.setProperty('--wght', wght); el.style.setProperty('--ls', ls) }), { sel: b.sel, wght, ls })
  // фон без тексту
  if (b.placeholder) await page.addStyleTag({ content: '.input::placeholder{color:transparent!important}' })
  if (!b.placeholder) await page.evaluate(({ sel }) => document.querySelectorAll(sel).forEach((el) => (el.style.visibility = 'hidden')), { sel: b.sel })
  const base = await shot(b.zone)
  if (!b.placeholder) await page.evaluate(({ sel }) => document.querySelectorAll(sel).forEach((el) => (el.style.visibility = '')), { sel: b.sel })
  else await page.evaluate(() => [...document.styleSheets].at(-1).ownerNode.remove())
  const target = mass(await refGrey(b.zone), base, b.pol)
  // еталонна ширина — за початкових wght/ls
  await setCss(parseFloat(start.wght), ls0)
  const w0 = await measure(b.sel, b.placeholder)
  const n = await page.evaluate(({ sel, placeholder }) => { const el = document.querySelector(sel); return (placeholder ? el.placeholder : el.textContent).length }, { sel: b.sel, placeholder: b.placeholder })
  const rows = []
  for (const wg of WEIGHTS) {
    await setCss(wg, ls0)
    const w1 = await measure(b.sel, b.placeholder)
    const ls = +(ls0 + (w0 - w1) / start.u / Math.max(1, n - 1)).toFixed(3)
    await setCss(wg, ls)
    const m = mass(await shot(b.zone), base, b.pol) // для плейсхолдера «текст» видно тільки на екрані без transparent
    rows.push({ wght: wg, ls, ratio: m / target })
  }
  rows.sort((a, c) => Math.abs(a.ratio - 1) - Math.abs(c.ratio - 1))
  out[name] = { best: rows[0], start: { wght: start.wght, ls: start.ls }, all: rows.slice(0, 4) }
  console.log(name.padEnd(12), `старт wght ${start.wght} → найкраща ${rows[0].wght} (ls ${rows[0].ls}, маса ${rows[0].ratio.toFixed(2)}× референсу)`)
  await setCss(rows[0].wght, rows[0].ls)
}
fs.writeFileSync(path.join(OUT, 'mass.json'), JSON.stringify(out, null, 2))
await browser.close()
