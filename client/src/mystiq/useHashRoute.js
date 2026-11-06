import { useSyncExternalStore } from 'react'

const subscribe = (callback) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

const getSnapshot = () => window.location.hash.replace(/^#\/?/, '') || 'landing'

export function useHashRoute() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function go(route) {
  window.location.hash = '/' + route
}
