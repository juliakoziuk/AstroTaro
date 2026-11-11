import { useEffect, useState } from 'react'
import { get, post } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { localDay } from './format.js'
import { streakNote } from './streakNote.js'
import { navProps } from './router.js'
import { cardBack, cardImage } from './live/cardimage.js'
import Frame from './Frame.jsx'
import { SparkleIcon } from './icons.jsx'
import './daily.css'

const DATE_LOCALES = { uk: 'uk-UA', en: 'en-GB' }
const dayName = (iso, lang, weekday) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(DATE_LOCALES[lang] ?? 'en-GB', { timeZone: 'UTC', ...(weekday ? { weekday } : { weekday: 'long', day: 'numeric', month: 'long' }) })

function Streak({ streak, week, lang }) {
  return (
    <aside className="streak" aria-label={t('Your streak')}>
      <div className="big">
        <b>{streak.current}</b>
        <span>{t('Days in a row')}</span>
      </div>
      <p className="note">{streakNote(streak)}</p>
      <ol className="week" aria-label={t('Last 7 days')}>
        {week.map((d, i) => (
          <li key={d.date} className={`${d.drawn ? 'done' : ''}${i === week.length - 1 ? ' now' : ''}`} title={dayName(d.date, lang)}>
            <i aria-label={d.drawn ? t('Card opened') : t('No card')}>{d.drawn ? '✦' : ''}</i>
            <span>{dayName(d.date, lang, 'narrow')}</span>
          </li>
        ))}
      </ol>
      <dl className="stats">
        <div><dt>{t('Best streak')}</dt><dd>{streak.longest}</dd></div>
        <div><dt>{t('Cards opened')}</dt><dd>{streak.total}</dd></div>
      </dl>
    </aside>
  )
}

export default function Daily() {
  const lang = useLang()
  const [state, setState] = useState(null) // null — ще вантажиться
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [flipped, setFlipped] = useState(false) // лице з'являється на кадр пізніше за картинку, щоб карта справді перевернулась, а не виникла готовою

  useEffect(() => {
    let live = true
    get(`/tarot/daily?date=${localDay()}`).then(
      (data) => live && setState(data),
      (e) => live && setError(e.message),
    )
    return () => {
      live = false
    }
  }, [lang])

  const reveal = async () => {
    setBusy(true)
    setError('')
    try {
      setState(await post('/tarot/daily', { date: localDay() }))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const card = state?.card
  const cardId = card?.id
  useEffect(() => {
    if (cardId == null) return undefined
    const frame = requestAnimationFrame(() => setFlipped(true))
    return () => cancelAnimationFrame(frame)
  }, [cardId])
  return (
    <Frame>
      <header>
        <a className="back" {...navProps('/tarot')}>← {t('Tarot')}</a>
        <h1>{t('Card of the day')}</h1>
        <p className="sub">
          {state ? dayName(state.date, lang) : t('Loading…')}
          <span className="rule" aria-hidden="true" />
        </p>
      </header>

      {error && <p className="err" role="alert">{error}</p>}

      {state && (
        <div className="daily">
          <section className="today-card" aria-live="polite">
            <div className={`flip${card && flipped ? ' open' : ''}`}>
              <img className="facedown" src={cardBack} alt={card ? '' : t('Today’s card, face down')} />
              {card && <img className={`faceup${card.reversed ? ' rev' : ''}`} src={cardImage(card.id)} alt={card.name} />}
            </div>
            {card ? (
              <div className="reading">
                <h2>{card.name}{card.reversed && <em>{t('Reversed')}</em>}</h2>
                <p>{card.text}</p>
                <a className="more" {...navProps('/tarot')}><SparkleIcon />{t('Ask a question in a full reading')}</a>
              </div>
            ) : (
              <div className="reading">
                <p className="hint">{t('One card for today. Open it, read it and carry it with you.')}</p>
                <button type="button" className="go" disabled={busy} onClick={reveal}>
                  <SparkleIcon />
                  {busy ? t('Opening…') : t('Reveal today’s card')}
                </button>
              </div>
            )}
          </section>
          <Streak streak={state.streak} week={state.week} lang={lang} />
        </div>
      )}
    </Frame>
  )
}
