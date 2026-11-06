// Сторінка Chrome зі шрифтами Google для вимірювань тексту (canvas.measureText) — без жодних припущень про метрики.
import { launch } from '../landing-diff.mjs'

const CHAINS = ['400;500;600;700', '400;700', '400']

/** Підключає шрифти: [{family, weights?}] → повертає список тих, що завантажились. */
export async function openFontPage(families) {
  const browser = await launch()
  const page = await browser.newPage()
  await page.goto('about:blank')
  const ok = []
  for (const f of families) {
    const chain = f.weights ? [f.weights.join(';'), ...CHAINS] : CHAINS
    const loaded = await page.evaluate(async (fam, chain) => {
      for (const ws of chain) {
        try {
          const r = await fetch(`https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, '+')}:wght@${ws}&display=swap`)
          if (!r.ok) continue
          const st = document.createElement('style')
          st.textContent = await r.text()
          document.head.appendChild(st)
          return ws
        } catch {
          /* наступна спроба */
        }
      }
      return null
    }, f.family, chain)
    if (loaded) ok.push({ ...f, loaded })
  }
  return { browser, page, loaded: ok }
}

/** jobs: [{family, wg, s, fs, ls}] → площа покриття літер (Σα, у px² при кегля fs): малюємо в canvas ×4 і рахуємо альфа-канал. */
export async function measureInk(page, jobs) {
  return page.evaluate(async (jobs) => {
    const K = 4
    const out = []
    for (const j of jobs) {
      const font = `${j.wg} ${Math.max(1, j.fs * K)}px "${j.family}"`
      await document.fonts.load(font, j.s).catch(() => [])
      const probe = document.createElement('canvas').getContext('2d')
      probe.font = font
      probe.letterSpacing = `${(j.ls ?? 0) * K}px`
      const m = probe.measureText(j.s)
      const pad = 4 * K
      const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight + pad * 2)
      const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + pad * 2)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.font = font
      ctx.letterSpacing = `${(j.ls ?? 0) * K}px`
      ctx.fillStyle = '#fff'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(j.s, pad + m.actualBoundingBoxLeft, pad + m.actualBoundingBoxAscent)
      const d = ctx.getImageData(0, 0, w, h).data
      let s = 0
      for (let i = 3; i < d.length; i += 4) s += d[i]
      out.push(s / 255 / (K * K))
    }
    return out
  }, jobs)
}

/** Працюючий URL CSS Google Fonts для пари гарнітур з fonts.json (перебір наборів ваг). */
export async function googleFontsHref(fonts) {
  const q = (ws) => ['serif', 'sans'].map((k) => `family=${fonts[k].family.replace(/ /g, '+')}:wght@${ws}`).join('&')
  for (const ws of [fonts.serif.weights.join(';'), '300;400;500;600;700', '400;500;600;700', '400;700', '400']) {
    const url = `https://fonts.googleapis.com/css2?${q(ws)}&display=swap`
    try {
      if ((await fetch(url)).ok) return url
    } catch {
      /* наступний набір */
    }
  }
  throw new Error('не вдалося підібрати URL Google Fonts для ' + JSON.stringify(fonts))
}

/** jobs: [{family, wg, s}] → метрики на 100px: W (ширина чорнила), ABL, A, D (чорнило), FA, FD (шрифт), adv. */
export async function measure(page, jobs) {
  return page.evaluate(async (jobs) => {
    const ctx = document.createElement('canvas').getContext('2d')
    const seen = new Set()
    for (const j of jobs) {
      const key = `${j.wg} 100px "${j.family}"`
      if (seen.has(key + j.s)) continue
      seen.add(key + j.s)
      await document.fonts.load(key, j.s).catch(() => [])
    }
    await document.fonts.ready
    return jobs.map((j) => {
      ctx.font = `${j.wg} 100px "${j.family}"`
      const ok = document.fonts.check(ctx.font, j.s)
      const m = ctx.measureText(j.s)
      return {
        ok,
        W: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
        ABL: m.actualBoundingBoxLeft,
        A: m.actualBoundingBoxAscent,
        D: m.actualBoundingBoxDescent,
        FA: m.fontBoundingBoxAscent,
        FD: m.fontBoundingBoxDescent,
        adv: m.width,
      }
    })
  }, jobs)
}
