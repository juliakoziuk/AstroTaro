import { useSyncExternalStore } from 'react'

// Мінімальний клієнтський роутер на hash-адресах (#/dashboard): працює без налаштувань сервера, дає кнопку «назад»
// браузера й історію. Усі переходи — pushState без перезавантаження сторінки.
//
//   useRoute()           поточний шлях, напр. '/tarot'
//   go('/tarot')         перейти (нова запис в історії)
//   back('/dashboard')   крок назад в історії застосунку; якщо її немає (екран відкрили напряму) — перехід на запасний шлях
//   navProps('/tarot')   {href, onClick} для будь-якого <a>: справжнє посилання (відкривається в новій вкладці
//                        з Ctrl/⌘-кліком), а звичайний клік — перехід без перезавантаження
//   navProps('back:/x')  те саме, але звичайний клік робить back('/x')

const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

let depth = window.history.state?.depth ?? 0
if (window.history.state?.depth == null) window.history.replaceState({ depth }, '')

window.addEventListener('popstate', () => {
  depth = window.history.state?.depth ?? 0
  emit()
})
// адресу змінили вручну (в рядку браузера): це новий запис без нашого стану
window.addEventListener('hashchange', () => {
  if (window.history.state?.depth == null) {
    depth += 1
    window.history.replaceState({ depth }, '')
  }
  emit()
})

const clean = (to) => '/' + String(to).replace(/^#?\/?/, '')
const read = () => clean(window.location.hash.split('?')[0].replace(/^#/, '') || '/')

export const useRoute = () =>
  useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    read,
    () => '/',
  )

export { hashParam } from '../lib/hashParam.js'

export function go(to, { replace = false } = {}) {
  const hash = '#' + clean(to)
  if (replace) window.history.replaceState({ depth }, '', hash)
  else window.history.pushState({ depth: ++depth }, '', hash)
  emit()
}

export function back(fallback = '/') {
  if (depth > 0) window.history.back()
  else go(fallback, { replace: true })
}

const plainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented

export function navProps(target) {
  const isBack = String(target).startsWith('back:')
  const to = clean(isBack ? target.slice(5) : target)
  return {
    href: '#' + to,
    onClick: (e) => {
      if (!plainClick(e)) return
      e.preventDefault()
      if (isBack) back(to)
      else go(to)
    },
  }
}
