// Збірка екрана застосунку з макета:
//   1) привʼязує живі елементи зі специфікації (scripts/app/specs/<id>.mjs, формат — dsl.mjs) до виявлених рядків,
//   2) за вимірами в Chrome (canvas.measureText) аналітично підбирає кегль, трекінг і позицію кожного рядка,
//   3) стирає текст і замінювані контролі з макета (гармонічний inpaint + зерно) → плита src/app/art/<id>.webp,
//   4) пише дані екрана src/app/data/<id>.json (їх рендерить src/app/Screen.jsx).
//   node scripts/app/build.mjs [id ...] [--no-plate]
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { SCREENS, W, H, root } from './common.mjs'
import { loadGraded } from './prepare.mjs'
import { parseDsl } from './dsl.mjs'
import { styleOf, baseOf } from './style.mjs'
import { openFontPage, measure, measureInk } from './fontpage.mjs'
import { dilateMask, harmonicFill, addGrain } from '../lib/inpaint.mjs'
import { pathToFileURL } from 'node:url'

const STRICT = 0.34
let fonts = JSON.parse(fs.readFileSync(path.join(root, 'scripts/app/fonts.json'), 'utf8'))
const NAV_HREFS = ['#/dashboard', '#/companion', '#/analysis', '#/pricing', '#/settings', '#/settings']
const NAV_LABELS = ['Home', 'Chat', 'Analytics', 'Access', 'Settings', 'Help']

const snapWeight = (fam, wg) => fonts[fam].weights.reduce((a, b) => (Math.abs(b - wg) < Math.abs(a - wg) ? b : a))
const median = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1]
const r2 = (v) => Math.round(v * 100) / 100

/** Тісний bbox рядка з урахуванням обрізання (x0/x1/y0/y1): перерахунок за пікселями. */
function remeasure(d, ov, g) {
  const hasOv = ['x0', 'x1', 'y0', 'y1'].some((k) => ov[k] != null)
  if (!hasOv) return { x0: d.x0, y0: d.y0, x1: d.x1, y1: d.y1, color: d.color }
  const cx0 = ov.x0 != null ? +ov.x0 : d.lx0
  const cx1 = ov.x1 != null ? +ov.x1 : d.lx1
  const cy0 = ov.y0 != null ? +ov.y0 : d.ly0
  const cy1 = ov.y1 != null ? +ov.y1 : d.ly1
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
  let cr = 0, cg = 0, cb = 0, cn = 0
  for (let y = cy0; y <= cy1; y++) {
    for (let x = cx0; x <= cx1; x++) {
      const p = y * W + x
      const dd = d.pol === 'b' ? g.lum[p] - g.bg[p] : g.bg[p] - g.lum[p]
      if (dd >= STRICT * d.peak) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
        if (dd >= 0.7 * d.peak) {
          cr += g.rgb[p * 3]
          cg += g.rgb[p * 3 + 1]
          cb += g.rgb[p * 3 + 2]
          cn++
        }
      }
    }
  }
  if (x1 < 0) throw new Error(`порожній bbox після обрізання ${JSON.stringify(ov)}`)
  const color = cn ? '#' + [cr, cg, cb].map((v) => Math.round(v / cn).toString(16).padStart(2, '0')).join('') : d.color
  return { x0, y0, x1, y1, color }
}

const pct = (arr, q) => arr.slice().sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor(arr.length * q))]

/**
 * Рядок, заданий рамкою вручну (box=x0,y0,x1,y1): тісний bbox і колір уточнюються за пікселями.
 * pol=d (за замовч.) — темний текст на світлій заливці (кнопка): «папір» = 85-й перцентиль яскравості, чорнило темніше за папір на 45+.
 */
function manualDetection(o, g) {
  const [bx0, by0, bx1, by1] = o.box.split(',').map(Number)
  const pol = o.pol ?? 'd'
  // запас навколо заданої рамки малий: більший зачіпає сусідні лінії (межу бульбашки під тайм-стемпом, «×» поруч із чипом)
  const PAD = o.pad != null ? +o.pad : 2
  const px = []
  for (let y = by0 - PAD; y <= by1 + PAD; y++) for (let x = bx0 - PAD; x <= bx1 + PAD; x++) px.push(y * W + x)
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
  let paper = null
  let peak
  const col = []
  if (pol === 'd') {
    paper = pct(px.map((p) => g.lum[p]), 0.85)
    for (const p of px) {
      if (g.lum[p] < paper - 45) {
        const x = p % W
        const y = (p / W) | 0
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
        col.push(p)
      }
    }
    peak = paper - pct(px.map((p) => g.lum[p]), 0.1)
    col.sort((a, b) => g.lum[a] - g.lum[b])
  } else {
    for (const p of px) {
      if (g.lum[p] - g.bg[p] > 18) {
        const x = p % W
        const y = (p / W) | 0
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
        col.push(p)
      }
    }
    peak = pct(px.map((p) => g.lum[p] - g.bg[p]), 0.9)
    col.sort((a, b) => g.lum[b] - g.lum[a])
  }
  if (x1 < 0) throw new Error(`порожня ручна рамка ${o.box}`)
  const top = col.slice(0, Math.max(6, Math.floor(col.length * 0.25)))
  const color = '#' + [0, 1, 2].map((c) => Math.round(top.reduce((s, p) => s + g.rgb[p * 3 + c], 0) / top.length).toString(16).padStart(2, '0')).join('')
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, lx0: x0, ly0: y0, lx1: x1, ly1: y1, pol, peak, color, paper }
}

/** Маса чорнила рядка в макеті: Σ покриття (відхилення від фону, нормоване піком) у тісній рамці; поріг відсікає зерно. */
function refInk(it, g) {
  const d = it.d
  const full = d.peak || 1
  let s = 0
  for (let y = it.box.y0 - 1; y <= it.box.y1 + 1; y++) {
    for (let x = it.box.x0 - 1; x <= it.box.x1 + 1; x++) {
      const p = y * W + x
      const v = d.paper != null ? d.paper - g.lum[p] : d.pol === 'b' ? g.lum[p] - g.bg[p] : g.bg[p] - g.lum[p]
      if (v > 10) s += Math.min(1.2, v / full)
    }
  }
  return s
}

/** Бічна панель: логотип-слово та 6 пунктів меню (автопошук серед виявлених рядків). */
function sidebarItems(det) {
  const brand = det.filter((d) => d.pol === 'b' && d.y0 >= 108 && d.y0 <= 170 && d.x0 >= 55 && d.x0 <= 115 && d.x1 <= 225 && d.w >= 90).sort((a, b) => b.w - a.w)[0]
  const nav = det.filter((d) => d.pol === 'b' && d.x0 >= 112 && d.x0 <= 145 && d.y0 >= 238 && d.y1 <= 640 && d.w >= 28 && d.h >= 10 && d.h <= 34).sort((a, b) => a.y0 - b.y0)
  if (!brand) throw new Error('у сайдбарі не знайдено слово MYSTIQ')
  if (nav.length !== 6) throw new Error(`у сайдбарі очікував 6 пунктів меню, знайдено ${nav.length}`)
  return { brand, nav }
}

async function buildScreen(id, page, opts) {
  const sc = SCREENS.find((s) => s.id === id)
  const spec = (await import(`./specs/${id}.mjs`)).default
  const det = JSON.parse(fs.readFileSync(path.join(root, `scripts/app/detections/${id}.json`), 'utf8'))
  const g = await loadGraded(id)
  const dsl = parseDsl(spec.dsl)

  // ---- 1. елементи ----
  const items = [] // {kind:'text'|'select'|'input', cls, text, det, box, color, ...}
  if (dsl.sidebar) {
    const sb = sidebarItems(det)
    items.push({ cls: 'brand', text: 'MYSTIQ', d: sb.brand, tag: 'span', href: '#/dashboard', sidebar: true })
    sb.nav.forEach((d, i) => items.push({ cls: 'nav', text: NAV_LABELS[i], d, tag: 'span', sidebar: true }))
    dsl.hits.push(
      { label: 'MYSTIQ', x: 60, y: 30, w: 150, h: 130, r: 20, href: '#/dashboard' },
      ...sb.nav.map((d, i) => ({ label: NAV_LABELS[i], x: 46, y: Math.round((d.y0 + d.y1) / 2) - 33, w: 184, h: 66, r: 33, href: NAV_HREFS[i], nav: true })),
    )
  }
  for (const t of dsl.texts) {
    const d = t.idx < 0 ? manualDetection(t.opts, g) : det[t.idx]
    if (!d) throw new Error(`${id}: немає виявленого рядка № ${t.idx}`)
    items.push({ cls: t.cls, text: t.text, d, ov: t.opts, tag: t.opts.tag, p: t.opts.p, href: t.opts.href, wgOv: t.opts.w, colorOv: t.opts.c })
  }
  for (const s of dsl.selects) items.push({ cls: s.cls, text: s.options[0], d: det[s.idx], ctl: { kind: 'select', ...s } })
  for (const s of dsl.inputs) items.push({ cls: s.cls, text: s.placeholder, d: det[s.idx], ctl: { kind: 'input', ...s } })
  for (const it of items) {
    if (!it.d) throw new Error(`${id}: рядок для «${it.text}» не знайдено`)
    it.box = remeasure(it.d, it.ov ?? {}, g)
    it.bw = it.box.x1 - it.box.x0 + 1
    it.bh = it.box.y1 - it.box.y0 + 1
    it.st = styleOf(it.cls)
    it.fam = it.st.fam
    it.wg = snapWeight(it.fam, it.wgOv ? +it.wgOv : it.st.wg)
    it.color = it.colorOv ?? it.box.color
  }

  // ---- 2. виміри й підгонка ----
  // Вага — за «масою чорнила»: для кожної ваги шрифту кегль підбирається за шириною рядка, і площа покриття літер
  // (canvas, Σα) порівнюється з масою чорнила в макеті. Підбір за піксельною різницею тут оманливий: він тягне до тонких
  // накреслень. Вага однакова для всього класу (cls): береться та, що дає найменшу сумарну похибку по його рядках.
  const MASS = process.env.MASS !== '0'
  // тонші за 400 накреслення на дрібному тексті не набирають повного кольору штрихів і здаються тьмяними — нижня межа ваги
  // і не далі ±200 від типової ваги класу: на коротких рядках (час, числа) маса чорнила ненадійна
  const candidates = (it) => fonts[it.fam].weights.filter((w) => w >= 400 && Math.abs(w - it.st.wg) <= 200)
  const wjobs = []
  items.forEach((it, i) => {
    const ws = MASS && !it.wgOv ? candidates(it) : [it.wg]
    for (const wg of ws) wjobs.push({ i, wg, family: fonts[it.fam].family, s: it.text })
  })
  const wmet = await measure(page, wjobs)
  const metOf = new Map() // `${i}:${wg}` -> метрики
  wjobs.forEach((j, k) => {
    if (!wmet[k].ok) console.warn(`  ! ${id}: шрифт не містить «${j.s}» (${j.family} ${j.wg})`)
    metOf.set(`${j.i}:${j.wg}`, wmet[k])
  })
  const fsOf = (it, m) => {
    const n = [...it.text].length
    const fsW = it.bw / (m.W / 100)
    const fsH = it.bh / ((m.A + m.D) / 100)
    return it.st.fit === 'h' ? fsH : n >= 5 ? fsW : fsH
  }
  const groups = new Map()
  for (const it of items) groups.set(it.cls, [...(groups.get(it.cls) ?? []), it])
  if (MASS) {
    const inkJobs = []
    wjobs.forEach((j, k) => inkJobs.push({ family: j.family, wg: j.wg, s: j.s, fs: fsOf(items[j.i], wmet[k]), ls: 0 }))
    const inks = await measureInk(page, inkJobs)
    const inkOf = new Map()
    wjobs.forEach((j, k) => inkOf.set(`${j.i}:${j.wg}`, inks[k]))
    items.forEach((it) => (it.ref = refInk(it, g)))
    const chosen = []
    for (const [cls, arr] of groups) {
      const free = arr.filter((it) => !it.wgOv && it.ref > 25)
      if (!free.length) continue
      let best = null
      for (const wg of candidates(arr[0])) {
        let err = 0
        for (const it of free) err += Math.abs(Math.log((inkOf.get(`${items.indexOf(it)}:${wg}`) || 1e-3) / it.ref))
        if (!best || err < best.err) best = { wg, err: err / free.length }
      }
      for (const it of arr) if (!it.wgOv) it.wg = best.wg
      chosen.push(`${cls}:${best.wg}`)
    }
    console.log(`  ваги за масою чорнила: ${chosen.join(' ')}`)
  }
  items.forEach((it, i) => {
    const m = metOf.get(`${i}:${it.wg}`)
    it.m = m
    it.n = [...it.text].length
    it.fsW = it.bw / (m.W / 100)
    it.fsH = it.bh / ((m.A + m.D) / 100)
    it.est = fsOf(it, m)
  })
  for (const [cls, arr] of groups) {
    const longs = arr.filter((x) => x.n >= 5)
    const med = median((longs.length ? longs : arr).map((x) => x.est))
    for (const it of arr) {
      let fs = it.est
      let ls = 0
      if (it.st.fit !== 'h' && it.n < 5 && longs.length) {
        fs = med // короткий рядок: висота розмитого чорнила на малих кеглях завищує оцінку — беремо кегль групи
      } else if (it.st.fit === 'h') {
        ls = it.n > 1 ? (it.bw - (it.m.W / 100) * fs) / (it.n - 1) : 0
      } else if (Math.abs(it.est / med - 1) <= 0.12) {
        fs = med
        ls = it.n > 1 ? (it.bw - (it.m.W / 100) * fs) / (it.n - 1) : 0
        if (Math.abs(ls) > 0.05 * fs) {
          fs = it.est
          ls = 0
        }
      }
      it.fs = fs
      it.ls = ls
      it.lh = Math.round(fs * 1.3 * 100) / 100
      const A = (it.m.A / 100) * fs
      const D = (it.m.D / 100) * fs
      const FA = (it.m.FA / 100) * fs
      const FD = (it.m.FD / 100) * fs
      const yc = (it.box.y0 + it.box.y1 + 1) / 2
      const baseline = yc - (D - A) / 2
      it.top = baseline - ((it.lh - (FA + FD)) / 2 + FA)
      it.left = it.box.x0 + (it.m.ABL / 100) * fs
    }
  }

  // ---- 3. дані екрана ----
  const textOut = (it) => ({
    s: it.text,
    tag: it.tag ?? it.st.tag ?? 'span',
    x: r2(it.left),
    y: r2(it.top),
    fs: r2(it.fs),
    ls: r2(it.ls),
    lh: r2(it.lh),
    c: it.color,
    f: it.fam,
    wg: it.wg,
    ...(it.p ? { p: it.p } : {}),
    ...(it.href ? { href: it.href } : {}),
  })
  const data = {
    id,
    route: sc.route,
    title: sc.title,
    texts: items.filter((it) => !it.ctl).map(textOut),
    hits: dsl.hits,
    toggles: dsl.toggles,
    radios: dsl.radios,
    checks: dsl.checks,
    reveals: dsl.reveals,
    clears: dsl.clears,
    selects: items.filter((it) => it.ctl?.kind === 'select').map((it) => ({ id: it.ctl.id, options: it.ctl.options, x: it.ctl.x, y: it.ctl.y, w: it.ctl.w, h: it.ctl.h, t: textOut(it) })),
    inputs: items.filter((it) => it.ctl?.kind === 'input').map((it) => ({ id: it.ctl.id, type: it.ctl.type, placeholder: it.ctl.placeholder, x: it.ctl.x, y: it.ctl.y, w: it.ctl.w, h: it.ctl.h, t: textOut(it) })),
  }
  fs.mkdirSync(path.join(root, 'src/app/data'), { recursive: true })
  fs.writeFileSync(path.join(root, `src/app/data/${id}.json`), JSON.stringify(data, null, 1))

  // ---- 4. плита: стирання ----
  if (!opts.noPlate) {
    const mask = new Uint8Array(W * H)
    for (const it of items) {
      const PAD = 4
      for (let y = Math.max(0, it.box.y0 - PAD); y <= Math.min(H - 1, it.box.y1 + PAD); y++) {
        for (let x = Math.max(0, it.box.x0 - PAD); x <= Math.min(W - 1, it.box.x1 + PAD); x++) {
          const p = y * W + x
          if (it.d.paper != null) {
            if (g.lum[p] < it.d.paper - 35) mask[p] = 1 // темний текст на світлій заливці
            continue
          }
          const dd = it.d.pol === 'b' ? g.lum[p] - g.bg[p] : g.bg[p] - g.lum[p]
          if (dd > 10 && (it.d.pol === 'b' || g.bg[p] > 100)) mask[p] = 1
        }
      }
    }
    const shapes = [
      ...dsl.toggles.map((t) => ({ x: t.x - 3, y: t.y - 3, w: t.w + 6, h: t.h + 6, r: (t.h + 6) / 2 })),
      ...dsl.radios.map((r) => ({ x: r.cx - r.d / 2 - 3, y: r.cy - r.d / 2 - 3, w: r.d + 6, h: r.d + 6, r: r.d / 2 + 3 })),
      ...dsl.checks.map((c) => ({ x: c.x - 3, y: c.y - 3, w: c.size + 6, h: c.size + 6, r: 6 })),
      ...dsl.erase,
    ]
    for (const s of shapes) {
      for (let y = Math.max(0, Math.floor(s.y)); y < Math.min(H, Math.ceil(s.y + s.h)); y++) {
        for (let x = Math.max(0, Math.floor(s.x)); x < Math.min(W, Math.ceil(s.x + s.w)); x++) {
          const cx = Math.min(Math.max(x, s.x + s.r), s.x + s.w - s.r)
          const cy = Math.min(Math.max(y, s.y + s.r), s.y + s.h - s.r)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= s.r * s.r) mask[y * W + x] = 1
        }
      }
    }
    const m2 = dilateMask(mask, W, H, 2)
    let filled = harmonicFill(g.rgb, W, H, m2)
    filled = await addGrain(filled, g.rgb, W, H, m2, { tile: 12 })
    fs.mkdirSync(path.join(root, 'src/app/art'), { recursive: true })
    const file = path.join(root, `src/app/art/${id}.webp`)
    await sharp(filled, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 96, smartSubsample: true, effort: 5 }).toFile(file)
    fs.mkdirSync(path.join(root, 'node_modules/.cache/app-build'), { recursive: true })
    await sharp(filled, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(root, `node_modules/.cache/app-build/${id}.plate.png`))
    let cnt = 0
    for (let i = 0; i < m2.length; i++) cnt += m2[i]
    console.log(`  плита: ${(fs.statSync(file).size / 1024).toFixed(0)} КБ, стерто ${cnt} px`)
  }
  const fsList = [...groups].map(([c, a]) => `${c}:${r2(median(a.map((x) => x.fs)))}`).join(' ')
  console.log(`${id.padEnd(10)} текстів ${data.texts.length}, hit ${data.hits.length}; кегль за групами — ${fsList}`)
}

/** Збирає екрани; ids порожній — усі, для яких є специфікація. fonts.json перечитується щоразу. */
export async function buildAll(ids = [], { noPlate = false } = {}) {
  fonts = JSON.parse(fs.readFileSync(path.join(root, 'scripts/app/fonts.json'), 'utf8'))
  const targets = ids.length ? ids : SCREENS.map((s) => s.id).filter((id) => fs.existsSync(path.join(root, `scripts/app/specs/${id}.mjs`)))
  const { browser, page, loaded } = await openFontPage(['serif', 'sans'].map((k) => ({ family: fonts[k].family, weights: fonts[k].weights })))
  try {
    if (loaded.length < 2) throw new Error('не вдалося завантажити шрифти Google (мережа?)')
    for (const id of targets) await buildScreen(id, page, { noPlate })
  } finally {
    await browser.close()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  await buildAll(args.filter((a) => !a.startsWith('--')), { noPlate: args.includes('--no-plate') })
}
