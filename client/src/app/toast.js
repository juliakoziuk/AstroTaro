import { useSyncExternalStore } from 'react'

// Глобальна підказка: живе між екранами (напр. «Reading saved» показується вже на екрані профілю).
let message = ''
let timer
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

export function say(text) {
  message = String(text)
  clearTimeout(timer)
  timer = setTimeout(() => {
    message = ''
    emit()
  }, 4000)
  emit()
}

export const useToast = () =>
  useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => message,
    () => '',
  )
