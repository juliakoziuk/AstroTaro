import { useEffect, useState } from 'react'

// Плита екрана — це WebP 3072x2048 (≈1 МБ). Якщо вставити її в сторінку просто так, Firefox декодує її шматками, і поки це триває,
// на місці арту видно білі плями, що «пробігають» екраном. Тому плиту спершу завантажуємо й декодуємо поза сторінкою (img.decode()),
// а в сторінку вставляємо вже готовою: до того на екрані лишається темний фон, а потім арт м'яко з'являється.
const finished = new Set() // адреси, що вже декодовані: наступного разу екран показується одразу
const pending = new Map() // адреса → { image, promise }: посилання на Image тримаємо, щоб розкодована картинка не пропала до вставки

export function decodePlate(url) {
  if (!url) return Promise.resolve()
  if (finished.has(url)) return Promise.resolve()
  if (!pending.has(url)) {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    const done = () => {
      finished.add(url)
      // багато плит у пам'яті не тримаємо: лишаємо кілька останніх
      pending.delete(url)
      keep.push(image)
      if (keep.length > 3) keep.shift()
    }
    const promise = (image.decode ? image.decode() : Promise.resolve()).then(done, done) // збій декодування не блокує екран
    pending.set(url, { image, promise })
  }
  return pending.get(url).promise
}
const keep = []

/** true, коли плита декодована (або вийшов час очікування: краще показати арт із плямами, ніж не показати зовсім). */
export function usePlateReady(url, maxWaitMs = 6000) {
  const [ready, setReady] = useState(() => !url || finished.has(url))
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
