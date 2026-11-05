import { LANGS, t, useLang } from './index.js'
import { chooseLanguage } from './sync.js'
import './lang-switch.css'

const SHORT = { en: 'EN', uk: 'УК', es: 'ES' }

/** Маленький перемикач мови для екранів до входу (лендінг, логін, реєстрація). */
export default function LangSwitch() {
  const lang = useLang()
  return (
    <div className="lang-switch" role="group" aria-label={t('Language')}>
      {LANGS.map((l) => (
        <button key={l.id} type="button" aria-pressed={l.id === lang} title={l.label} onClick={() => chooseLanguage(l.id).catch(() => {})}>
          {SHORT[l.id]}
        </button>
      ))}
    </div>
  )
}
