import { useEffect, useRef } from 'react'

// Збирає пропси для <Bug> з опису + файлів із папки bugs/ (див. import.meta.glob у кожному уроці).
// comps — компоненти (*.jsx), raws — вихідний текст (*.jsx і *.txt).
export function pickBugs(list, comps, raws, causes) {
  const bugs = list.map((b, i) => ({
    number: i + 1,
    ...b,
    Live: comps[`./bugs/${b.file}.jsx`],
    code: raws[`./bugs/${b.file}.jsx`] ?? raws[`./bugs/${b.file}.txt`],
  }))
  return causes ? addChoices(bugs, causes) : bugs
}

// Скільки разів компонент «оновився» (потрапив у DOM). Повертає ref для <b ref={…}>.
// Працює правильно і в StrictMode: повторний запуск ефекту при монтуванні не рахується.
export function useRenderCount() {
  const el = useRef(null)
  const count = useRef(0)
  const skip = useRef(false)

  useEffect(() => {
    return () => {
      skip.current = true
    }
  }, [])

  useEffect(() => {
    if (skip.current) skip.current = false
    else count.current += 1
    if (el.current) el.current.textContent = String(count.current)
  })

  return el
}

// До кожного прикладу з помилкою додає 4 варіанти відповіді на «Що тут не так?»:
// правильний (causes[i]) + три причини з сусідніх прикладів цього ж уроку.
export function addChoices(list, causes) {
  const n = list.length
  return list.map((b, i) => ({
    ...b,
    choices: [causes[i], ...[1, 2, 3].map((k) => causes[(i + k) % n])],
  }))
}
