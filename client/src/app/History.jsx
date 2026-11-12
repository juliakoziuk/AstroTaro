import { useEffect, useMemo, useState } from 'react'
import { api, del, get, patch, post } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { formatDate, formatTime, snippet } from './format.js'
import { go, navProps } from './router.js'
import { session } from './live/common.js'
import { cardImage } from './live/cardimage.js'
import Frame from './Frame.jsx'
import { ShareIcon, SparkleIcon, StarIcon, TrashIcon } from './icons.jsx'
import './history.css'

const VERDICT = { yes: 'Yes', no: 'No', maybe: 'Not yet' }
const THUMBS = 5 // скільки карт показуємо в рядку; більші розклади скорочуємо

const FILTERS = ['all', 'saved', 'waiting']
const readFilter = () => (FILTERS.includes(session.get('historyFilter')) ? session.get('historyFilter') : 'all')
const ANSWERS = [
  ['yes', 'Yes'],
  ['partly', 'Partly'],
  ['no', 'No'],
]
const ANSWER_TEXT = { yes: 'Came true', partly: 'Partly came true', no: 'Did not come true' }
const MIN_ANSWERS = 5 // менше відповідей — відсоток нічого не каже, тож його не показуємо

/** «Збулося?» у цифрах: відповіді людини, відсоток (від кількох відповідей) і карти, що повертаються. */
function Track({ stats, cardNames, onShowWaiting }) {
  const { answered, yes, partly, no, waiting, rate, topCards } = stats
  if (!answered && !waiting) return null
  return (
    <section className="track" aria-label={t('How your readings turned out')}>
      <h2>{t('How your readings turned out')}</h2>
      {answered > 0 && (
        <>
          <dl className="counts">
            <div className="yes"><dt>{t('Came true')}</dt><dd>{yes}</dd></div>
            <div className="partly"><dt>{t('Partly')}</dt><dd>{partly}</dd></div>
            <div className="no"><dt>{t('Did not')}</dt><dd>{no}</dd></div>
          </dl>
          <p className="rate">
            {answered >= MIN_ANSWERS
              ? t('Your own marks: {rate}% of readings came true.', { rate })
              : t('Answer {n} more readings to see how often yours come true.', { n: MIN_ANSWERS - answered })}
          </p>
        </>
      )}
      {topCards.length > 0 && cardNames.length > 0 && (
        <p className="recurring">
          {t('Cards that keep returning')}:{' '}
          {topCards.map((c) => (
            <b key={c.id}>{cardNames[c.id]} ×{c.count}</b>
          ))}
        </p>
      )}
      {waiting > 0 && (
        <p className="waiting">
          {t('{n} readings are waiting for your answer.', { n: waiting })}{' '}
          <button type="button" className="linkish" onClick={onShowWaiting}>{t('Answer them')}</button>
        </p>
      )}
    </section>
  )
}

export default function History() {
  const lang = useLang()
  const [items, setItems] = useState(null) // null — ще вантажиться
  const [names, setNames] = useState({}) // id розкладу → назва мовою інтерфейсу
  const [fmt, setFmt] = useState({ dateFormat: 'DD/MM/YYYY', timeFormat: '24-hour' })
  const [filter, setFilter] = useState(readFilter)
  const [confirming, setConfirming] = useState(null) // id запису, який людина збирається видалити
  const [error, setError] = useState('')
  const [sharing, setSharing] = useState(null) // { id, url } — запис, чиє посилання зараз показано
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState(null) // «Збулося?» у цифрах; null — ще немає або не завантажилось
  const [cardNames, setCardNames] = useState([]) // назви карт за id, для «карт, що повертаються»
  const [changing, setChanging] = useState(null) // id запису, відповідь якого людина хоче змінити

  useEffect(() => {
    let live = true
    // підсумок і назви карт — другорядні: без них історія працює, тому їхній збій не псує екран
    Promise.all([get('/spreads'), get('/tarot/spreads'), get('/settings'), get('/spreads/accuracy').catch(() => null), get('/tarot/cards').catch(() => [])])
      .then(([rows, spreads, settings, accuracy, cards]) => {
        if (!live) return
        setStats(accuracy)
        setCardNames(cards.map((c) => c.name))
        setItems(rows)
        setNames(Object.fromEntries(spreads.map((s) => [s.id, s.name])))
        setFmt(settings)
      })
      .catch((e) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [lang])

  const shown = useMemo(
    () => (items ?? []).filter((r) => filter === 'all' || (filter === 'saved' ? r.saved : r.outcomeDue)),
    [items, filter],
  )
  const savedCount = (items ?? []).filter((r) => r.saved).length
  const waitingCount = (items ?? []).filter((r) => r.outcomeDue).length

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
  const share = async (r) => {
    setError('')
    setCopied(false)
    try {
      const { token, url } = await post(`/spreads/${r.id}/share`)
      setItems((list) => list.map((x) => (x.id === r.id ? { ...x, shareToken: token } : x)))
      setSharing({ id: r.id, url })
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      } catch {
        /* без доступу до буфера людина скопіює посилання з поля */
      }
    } catch (e) {
      setError(e.message)
    }
  }
  const unshare = async (r) => {
    setError('')
    try {
      await del(`/spreads/${r.id}/share`)
      setItems((list) => list.map((x) => (x.id === r.id ? { ...x, shareToken: null } : x)))
      setSharing(null)
    } catch (e) {
      setError(e.message)
    }
  }
  /** Відповісти «Збулося?» (або змінити відповідь); підсумок оновлюємо окремим запитом, він лише лічильники. */
  const saveAnswer = async (r, request) => {
    setError('')
    try {
      const updated = await request()
      setItems((list) => list.map((x) => (x.id === r.id ? updated : x)))
      setChanging(null)
      get('/spreads/accuracy').then(setStats, () => {})
    } catch (e) {
      setError(e.message)
    }
  }
  const answer = (r, outcome) => saveAnswer(r, () => api('PUT', `/spreads/${r.id}/outcome`, { outcome }))
  const clearAnswer = (r) => saveAnswer(r, () => del(`/spreads/${r.id}/outcome`))
  const pickFilter = (value) => {
    session.set('historyFilter', value)
    setFilter(value)
  }

  return (
    <Frame>
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
        {waitingCount > 0 && (
          <button role="tab" aria-selected={filter === 'waiting'} className={filter === 'waiting' ? 'on' : ''} onClick={() => pickFilter('waiting')}>
            {t('Waiting')} · {waitingCount}
          </button>
        )}
      </div>

      {stats && <Track stats={stats} cardNames={cardNames} onShowWaiting={() => pickFilter('waiting')} />}

      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}

      {items && shown.length === 0 && (
        <div className="empty">
          <p>{filter === 'saved' ? t('No saved readings yet') : filter === 'waiting' ? t('No readings are waiting for an answer') : t('No readings yet')}</p>
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
                    <button className={`icon${r.shareToken ? ' on' : ''}`} onClick={() => share(r)} aria-label={t('Share reading')} title={t('Share reading')}>
                      <ShareIcon />
                    </button>
                    <button className="icon" onClick={() => setConfirming(r.id)} aria-label={t('Delete reading')} title={t('Delete reading')}>
                      <TrashIcon />
                    </button>
                  </>
                )}
              </div>
              {(r.outcomeDue || r.outcome) && (
                <div className={`outcome${r.outcome ? ` ${r.outcome}` : ''}`}>
                  {r.outcome && changing !== r.id ? (
                    <>
                      <span className="mark">{t(ANSWER_TEXT[r.outcome])}</span>
                      <button type="button" className="linkish" onClick={() => setChanging(r.id)}>{t('Change')}</button>
                    </>
                  ) : (
                    <>
                      <span className="ask">{t('Did it come true?')}</span>
                      <span className="choices" role="group" aria-label={t('Did it come true?')}>
                        {ANSWERS.map(([id, label]) => (
                          <button key={id} type="button" className={`pick ${id}${r.outcome === id ? ' on' : ''}`} aria-pressed={r.outcome === id} onClick={() => answer(r, id)}>
                            {t(label)}
                          </button>
                        ))}
                      </span>
                      {r.outcome && (
                        <>
                          <button type="button" className="linkish" onClick={() => clearAnswer(r)}>{t('Remove my answer')}</button>
                          <button type="button" className="linkish" onClick={() => setChanging(null)}>{t('Cancel')}</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
              {sharing?.id === r.id && (
                <div className="sharebox" role="group" aria-label={t('Share reading')}>
                  <p>{t('Anyone with this link can see this reading, but not your account.')}</p>
                  <input readOnly value={sharing.url} aria-label={t('Link to the reading')} onFocus={(e) => e.target.select()} />
                  {copied && <p className="copied" role="status">{t('Link copied')}</p>}
                  <div className="acts">
                    <button className="plain" onClick={() => setSharing(null)}>{t('Close')}</button>
                    <button className="danger" onClick={() => unshare(r)}>{t('Stop sharing')}</button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Frame>
  )
}
