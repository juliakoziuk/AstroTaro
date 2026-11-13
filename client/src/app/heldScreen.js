import { useEffect, useState } from 'react'
import { decodePlate, isDecoded, plateUrl } from './plate.js'

// Скільки найдовше тримаємо попередній екран, чекаючи плиту нового. Далі показуємо новий, хоч би він ще добудовувався.
export const HOLD_MS = 1500

/** Плита екрана з намальованим фоном; екрани без плити (вхід, лендінг, облікові сторінки, налаштування) повертають undefined. */
export const plateOf = (s) => (s.kind === 'app' && s.id !== 'settings' && s.data ? plateUrl(s.data, s.id === 'register') : undefined)

/**
 * Який екран малювати. Між двома екранами з плитою попередній лишається на місці, доки плита нового не завантажена й не декодована:
 * людина бачить готовий екран одразу, а не добудову на очах (білі плями, темний фон). Усі інші переходи (вхід, вихід, лендінг)
 * миттєві, а охорона маршрутів (вхід, онбординг) працює за target — куди людина йде насправді, а не за тим, що ще на екрані.
 */
export function useHeldScreen(target) {
  const [shown, setShown] = useState(target)
  const url = plateOf(target)
  // зміна вигляду (світла тема ↔ темна) теж без очікування: тримати попередній екран тут нема чого
  const immediate = !url || isDecoded(url) || !plateOf(shown) || shown.kind !== target.kind
  // оновлення стану під час малювання (дозволений прийом): коли тримати нічого, одразу переходимо на новий екран
  if (immediate && shown !== target) setShown(target)

  useEffect(() => {
    if (immediate || shown === target) return undefined
    let live = true
    let timer
    const wait = new Promise((resolve) => {
      timer = setTimeout(resolve, HOLD_MS)
    })
    Promise.race([decodePlate(url), wait]).then(() => live && setShown(target))
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [immediate, target, shown, url])

  return immediate ? target : shown
}
