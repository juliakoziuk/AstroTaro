import { useEffect, useState } from 'react'
import '../login/account.css'
import { get } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { cardImage } from './live/cardimage.js'
import { formatDate } from './format.js'
import { hashParam, navProps } from './router.js'

// Публічна сторінка розкладу, яким з вами поділилися: відкривається за посиланням без входу, лише читання.
export default function SharedReading() {
  const lang = useLang()
  const token = hashParam('token')
  const [state, setState] = useState({ status: token ? 'loading' : 'missing', reading: null, names: {}, error: '' })

  useEffect(() => {
    if (!token) return undefined
    let live = true
    Promise.all([get(`/shared/${encodeURIComponent(token)}`), get('/tarot/spreads')]).then(
      ([reading, spreads]) => live && setState({ status: 'ready', reading, names: Object.fromEntries(spreads.map((s) => [s.id, s.name])), error: '' }),
      (e) => live && setState({ status: 'failed', reading: null, names: {}, error: e.message }),
    )
    return () => {
      live = false
    }
  }, [token, lang])

  const { reading, names } = state
  return (
    <div className="v-account">
      <main className="account-page">
        <section className="account-card wide" aria-labelledby="shared-title">
          <div className="account-brand" aria-hidden="true">MYSTIQ</div>
          {state.status === 'loading' && <p role="status">{t('Loading…')}</p>}
          {state.status === 'missing' && <p className="account-error" role="alert">{t('This link has no token. Open the link from the email again.')}</p>}
          {state.status === 'failed' && <p className="account-error" role="alert">{t('This reading is not shared any more, or the link is wrong.')}</p>}
          {reading && (
            <>
              <h1 id="shared-title">{names[reading.spreadId] ?? reading.spreadId}</h1>
              <p className="shared-date">{t('A reading shared with you')} · {formatDate(reading.date, 'DD/MM/YYYY')}</p>
              {reading.question && <p className="shared-question">“{reading.question}”</p>}
              <ul className="shared-cards">
                {reading.cards.map((c, i) => (
                  <li key={`${c.id}-${i}`}>
                    <img src={cardImage(c.id)} alt={reading.result?.positions?.[i]?.card ?? ''} className={c.reversed ? 'rev' : ''} />
                    <span>{reading.result?.positions?.[i]?.label}</span>
                    <b>{reading.result?.positions?.[i]?.card}{c.reversed ? ` · ${t('Reversed')}` : ''}</b>
                  </li>
                ))}
              </ul>
              {reading.result?.summary && <p className="shared-summary">{reading.result.summary}</p>}
              <a className="account-button" {...navProps('/register')}>{t('Make your own reading')}</a>
            </>
          )}
          <a className="account-back" {...navProps('/')}>{t('Back to the main page')}</a>
        </section>
      </main>
    </div>
  )
}
