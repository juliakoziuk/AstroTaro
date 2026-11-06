// Мова інтерфейсу й налаштування користувача на сервері (поле «Language»): один напрям синхронізації в кожній ситуації.
import { get, getToken, patch } from '../lib/api.js'
import { getLang, langFromSetting, setLang, settingOf } from './index.js'

/** Користувач обрав мову: застосовуємо одразу й, якщо він увійшов, зберігаємо в його налаштуваннях. */
export async function chooseLanguage(id) {
  setLang(id)
  if (getToken()) await patch('/settings', { language: settingOf(id) })
}

/** Вхід в наявний акаунт або запуск із токеном: мова з налаштувань сервера важливіша за локальну. */
export async function applyServerLanguage() {
  const s = await get('/settings')
  setLang(langFromSetting(s.language))
}

/** Щойно створений акаунт: переносимо на сервер мову, яку людина вже обрала на сторінці входу. */
export const saveCurrentLanguage = () => chooseLanguage(getLang())
