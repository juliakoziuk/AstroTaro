import { useSyncExternalStore } from 'react'

/** Підписка на CSS media query (без стану й ефектів: useSyncExternalStore). */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', notify)
      return () => m.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
