import { useEffect, useState } from 'react'

// Плита екрана — намальований фон-арт. Щоб екран з'являвся одразу готовим, а не добудовувався на очах:
//  1) плиту обирають за розміром вікна: до 1536 фізичних пікселів — легка 1x, до 1920 — середня (≈0,3 МБ), далі — велика 2x (≈1 МБ);
//  2) плиту завантажують і декодують поза сторінкою (img.decode()) і вставляють у сторінку вже готовою. Якщо вставити «сиру»
//     3072x2048, Firefox декодує її шматками прямо на очах, і по екрану «пробігають» білі плями;
//  3) наступні екрани готуються наперед (prefetchPlates, а також при наведенні на посилання: див. App.jsx), а попередній екран
//     лишається на місці, доки новий не готовий.

const MID_MAX = 1920
const ONE_X_MAX = 1536

/** Потрібна ширина плити у фізичних пікселях: ширина вікна × щільність пікселів (масштаб сторінки в браузері теж враховано). */
const needed = () => (globalThis.innerWidth || ONE_X_MAX) * (globalThis.devicePixelRatio || 1)

/** Яку плиту показувати для екрана d. guest — екран, де арт по боках картки збільшується до країв вікна: йому потрібна повна. */
export function plateUrl(d, guest = false) {
  if (!d) return undefined
  if (guest) return d.plate2
  const w = needed()
  if (w <= ONE_X_MAX && d.plate) return d.plate
  if (w <= MID_MAX && d.plateMid) return d.plateMid
  return d.plate2 ?? d.plateMid ?? d.plate
}

const finished = new Set() // адреси, що вже декодовані: наступного разу екран показується одразу
const pending = new Map() // адреса → проміс декодування
const keep = [] // кілька останніх Image: посилання тримаємо, щоб розкодована картинка не пропала до вставки в сторінку

export const isDecoded = (url) => !url || finished.has(url)

export function decodePlate(url) {
  if (isDecoded(url)) return Promise.resolve()
  if (!pending.has(url)) {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    const done = () => {
      finished.add(url)
      pending.delete(url)
      keep.push(image)
      if (keep.length > 4) keep.shift() // багато 25-мегабайтних плит у пам'яті не тримаємо
    }
    pending.set(url, (image.decode ? image.decode() : Promise.resolve()).then(done, done)) // збій декодування не блокує екран
  }
  return pending.get(url)
}

/** Завантажити плити в кеш браузера (без декодування): спокійно, по одній, лише коли це не заважає (економія трафіку — ні). */
export function prefetchPlates(urls, gapMs = 400) {
  const conn = globalThis.navigator?.connection
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) return () => {}
  let stop = false
  ;(async () => {
    for (const url of urls) {
      if (stop) return
      if (url && !finished.has(url)) {
        const image = new Image()
        image.decoding = 'async'
        image.src = url // лише завантаження в кеш: декодувати плиту будемо перед показом
        await new Promise((r) => setTimeout(r, gapMs))
      }
    }
  })()
  return () => {
    stop = true
  }
}

/** true, коли плита декодована (або вийшов час очікування: краще показати арт, що добудовується, ніж не показати зовсім). */
export function usePlateReady(url, maxWaitMs = 6000) {
  const [ready, setReady] = useState(() => isDecoded(url))
  useEffect(() => {
    if (ready) return undefined
    let live = true
    const timer = setTimeout(() => live && setReady(true), maxWaitMs)
    decodePlate(url).then(() => live && setReady(true))
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [url, ready, maxWaitMs])
  return ready
}
