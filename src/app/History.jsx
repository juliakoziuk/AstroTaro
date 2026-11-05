import { useEffect, useMemo, useState } from 'react'
import { del, get, patch } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { formatDate, formatTime, snippet } from './format.js'
import { go, navProps } from './router.js'
import { session } from './live/common.js'
import { cardImage } from './live/cardimage.js'
import Frame from './Frame.jsx'
import { SparkleIcon, StarIcon, TrashIcon } from './icons.jsx'
import './history.css'

const VERDICT = { yes: 'Yes', no: 'No', maybe: 'Not yet' }
const THUMBS = 5 // скільки карт показуємо в рядку; більші розклади скорочуємо

const readFilter = () => (session.get('historyFilter') === 'saved' ? 'saved' : 'all')

export default function History() {
  const lang = useLang()
  const [items, setItems] = useState(null) // null — ще вантажиться
  const [names, setNames] = useState({}) // id розкладу → назва мовою інтерфейсу
  const [fmt, setFmt] = useState({ dateFormat: 'DD/MM/YYYY', timeFormat: '24-hour' })
  const [filter, setFilter] = useState(readFilter)
  const [confirming, setConfirming] = useState(null) // id запису, який людина збирається видалити
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    Promise.all([get('/spreads'), get('/tarot/spreads'), get('/settings')])
      .then(([rows, spreads, settings]) => {
        if (!live) return
        setItems(rows)
        setNames(Object.fromEntries(spreads.map((s) => [s.id, s.name])))
        setFmt(settings)
      })
      .catch((e) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [lang])

  const shown = useMemo(() => (items ?? []).filter((r) => filter === 'all' || r.saved), [items, filter])
  const savedCount = (items ?? []).filter((r) => r.saved).length

  const open = (r) => {
    session.set('readingId', r.id)
    go('/reading')
  }
  const toggleSaved = async (r) => {
    setError('')
    try {
      const updated = await patch(`/spreads/${r.id}`, { saved: !r.saved })
      setItems((list) => list.map((x) => (x.id === r.id ? updated : x)))
    } catch (e) {
      setError(e.message)
    }
  }
  const remove = async (r) => {
    setError('')
    try {
      await del(`/spreads/${r.id}`)
      setItems((list) => list.filter((x) => x.id !== r.id))
      setConfirming(null)
    } catch (e) {
      setError(e.message)
    }
  }
  const pickFilter = (value) => {
    session.set('historyFilter', value)
    setFilter(value)
  }

  return (
    <Frame active="/history">
      <header>
        <a className="back" {...navProps('/tarot')}>← {t('Tarot')}</a>
        <h1>{t('Reading history')}</h1>
        <p className="sub">
          {items ? t('{n} readings', { n: items.length }) : t('Loading…')}
          <span className="rule" aria-hidden="true" />
        </p>
      </header>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'on' : ''} onClick={() => pickFilter('all')}>
          {t('All readings')}
        </button>
        <button role="tab" aria-selected={filter === 'saved'} className={filter === 'saved' ? 'on' : ''} onClick={() => pickFilter('saved')}>
          <StarIcon filled={filter === 'saved'} />
          {t('Saved')} · {savedCount}
        </button>
      </div>

      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}

      {items && shown.length === 0 && (
        <div className="empty">
          <p>{filter === 'saved' ? t('No saved readings yet') : t('No readings yet')}</p>
          <a className="go" {...navProps('/tarot')}>
            <SparkleIcon />
            {t('Start a reading')}
          </a>
        </div>
      )}

      <ul className="hist">
        {shown.map((r) => {
          const res = r.result
          return (
            <li key={r.id} className="entry">
              <button className="open" onClick={() => open(r)}>
                <span className="thumbs" aria-hidden="true">
                  {r.cards.slice(0, THUMBS).map((c) => (
                    <img key={c.id} src={cardImage(c.id)} alt="" className={c.reversed ? 'rev' : ''} />
                  ))}
                  {r.cards.length > THUMBS && <b>+{r.cards.length - THUMBS}</b>}
                </span>
                <span className="meta">
                  <span className="top">
                    <strong>{names[r.spreadId] ?? r.spreadId}</strong>
                    {res?.verdict && <em className={`verdict ${res.verdict.answer}`}>{t(VERDICT[res.verdict.answer])}</em>}
                  </span>
                  <time dateTime={r.date}>
                    {formatDate(r.date, fmt.dateFormat)} · {formatTime(r.date, fmt.timeFormat)}
                  </time>
                  {r.question && <span className="q">“{snippet(r.question, 110)}”</span>}
                  {res && <span className="sum">{snippet(res.summary, 170)}</span>}
                </span>
              </button>
              <div className="acts">
                {confirming === r.id ? (
                  <>
                    <button className="danger" onClick={() => remove(r)}>{t('Yes, delete')}</button>
                    <button className="plain" onClick={() => setConfirming(null)}>{t('Cancel')}</button>
                  </>
                ) : (
                  <>
                    <button className={`icon${r.saved ? ' on' : ''}`} onClick={() => toggleSaved(r)} aria-pressed={r.saved} aria-label={r.saved ? t('Remove from saved') : t('Save reading')} title={r.saved ? t('Remove from saved') : t('Save reading')}>
                      <StarIcon filled={r.saved} />
                    </button>
                    <button className="icon" onClick={() => setConfirming(r.id)} aria-label={t('Delete reading')} title={t('Delete reading')}>
                      <TrashIcon />
                    </button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Frame>
  )
}
