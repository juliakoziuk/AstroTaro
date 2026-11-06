// Тема й налаштування користувача на сервері (поле «Theme»): той самий порядок, що й для мови (i18n/sync.js).
import { get, getToken, patch } from './api.js'
import { setTheme, settingOf, themeFromSetting } from './theme.js'

/** Користувач обрав тему: застосовуємо одразу й, якщо він увійшов, зберігаємо в його налаштуваннях. */
export async function chooseTheme(next) {
  setTheme(next)
  if (getToken()) await patch('/settings', { theme: settingOf(next) })
}

/** Вхід в акаунт або запуск із токеном: тема з налаштувань сервера важливіша за локальну. */
export async function applyServerTheme() {
  const settings = await get('/settings')
  setTheme(themeFromSetting(settings.theme))
}
