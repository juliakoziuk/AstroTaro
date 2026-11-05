import { useEffect, useMemo, useRef, useState } from 'react'
import { get, post } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { go, navProps } from './router.js'
import { session } from './live/common.js'
import { cardBack, cardImage } from './live/cardimage.js'
import Frame from './Frame.jsx'
import { DeckIcon, FeatherIcon, LayersIcon, ShuffleIcon, SparkleIcon, UndoIcon } from './icons.jsx'

const CARD_COUNT = 78
const REVERSED_SHARE = 0.3 // як і на сервері: кожна третя-четверта карта лягає перевернутою
const SHUFFLE_MS = 1950 // три «рифли» по 0,64 с (draw.css, riffle) і мить, щоб купка вляглася
const PILE = 14 // карт у купці, що тасується на екрані: усі 78 не потрібні, око не відрізнить

/** Випадкове число 0..1 від системного генератора браузера (а не Math.random): тасування — справжня воля людини + випадок. */
function randomUnit() {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] / 2 ** 32
}

function shuffled() {
  const ids = Array.from({ length: CARD_COUNT }, (_, i) => i)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(randomUnit() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids
}

function readSetup() {
  try {
    return JSON.parse(session.get('draw') ?? 'null')
  } catch {
    return null
  }
}

function Face({ card, name }) {
  return (
    <figure className="face">
      <img src={cardImage(card.id)} alt={name} className={card.reversed ? 'rev' : ''} />
      <figcaption>
        {name}
        {card.reversed && <em>{t('Reversed')}</em>}
      </figcaption>
    </figure>
  )
}

/** Порожня рамка під карту: промені, зірка-підказка й кутові зірочки. */
function Blank() {
  return (
    <div className="blank">
      <b>?</b>
      <i className="c tl" />
      <i className="c tr" />
      <i className="c bl" />
      <i className="c br" />
    </div>
  )
}

export default function Draw() {
  const lang = useLang()
  const setup = useMemo(readSetup, [])
  const [spread, setSpread] = useState(null)
  const [names, setNames] = useState([])
  const [mode, setMode] = useState('deck') // 'deck' — тягнути з колоди, 'own' — ввести карти зі своєї колоди
  const [order, setOrder] = useState(shuffled) // порядок закритих карт; лише індекси, що людина обирає, стають картами
  const [picked, setPicked] = useState([]) // [{ index, id, reversed }] у порядку витягування
  const [own, setOwn] = useState([]) // [{ id: '', reversed: false }] за позиціями
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [shuffling, setShuffling] = useState(false)
  const [round, setRound] = useState(0) // нова колода — нова анімація розкладання карт
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (!setup) {
      go('/tarot', { replace: true })
      return
    }
    let live = true
    Promise.all([get('/tarot/spreads'), get('/tarot/cards')])
      .then(([spreads, cards]) => {
        if (!live) return
        const s = spreads.find((x) => x.id === setup.spreadId)
        if (!s) return go('/tarot', { replace: true })
        setSpread(s)
        setNames(cards.map((c) => c.name))
        setOwn((prev) => (prev.length === s.positions.length ? prev : s.positions.map(() => ({ id: '', reversed: false }))))
      })
      .catch((e) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [setup, lang])

  if (!setup) return null
  const total = spread?.positions.length ?? 0
  const cards = mode === 'deck' ? picked : own.map((o) => ({ id: o.id === '' ? null : Number(o.id), reversed: o.reversed }))
  const complete = total > 0 && cards.length === total && cards.every((c) => c.id !== null && c.id !== undefined)

  // усі карти витягнуто: далі їх не змінити (ні скасувати, ні перетасувати), як і з справжньою колодою
  const drawn = mode === 'deck' && total > 0 && picked.length >= total

  const pick = (index) => {
    const reversed = randomUnit() < REVERSED_SHARE
    // функціональне оновлення: швидкі клацання поспіль не затирають одне одного
    setPicked((list) => (list.length >= total || list.some((p) => p.index === index) ? list : [...list, { index, id: order[index], reversed }]))
  }
  const reshuffle = () => {
    if (shuffling) return
    setPicked([])
    const done = () => {
      setOrder(shuffled())
      setRound((n) => n + 1)
      setShuffling(false)
    }
    // людині, яка просила менше руху в системі, показуємо результат одразу
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return done()
    setShuffling(true)
    timer.current = setTimeout(done, SHUFFLE_MS)
  }
  const setOwnAt = (i, patch) => setOwn((list) => list.map((o, j) => (j === i ? { ...o, ...patch } : o)))
  const usedOwn = new Set(own.map((o) => o.id).filter((x) => x !== ''))

  const reveal = async () => {
    setBusy(true)
    setError('')
    try {
      const body = { spreadId: setup.spreadId, deck: setup.deck, mode: setup.mode, question: question.trim(), cards: cards.map((c) => ({ id: c.id, reversed: c.reversed })) }
      const reading = await post('/tarot/readings', body)
      session.set('readingId', reading.id)
      go('/reading')
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Frame active="/tarot">
          <header>
            <a className="back" {...navProps('/tarot')}>← {t('Tarot')}</a>
            <h1>{t('Draw your cards')}</h1>
            <p className="sub">
              {spread ? t('{name}: pick one card for each position.', { name: spread.name }) : t('Loading…')}
              <span className="rule" aria-hidden="true" />
            </p>
          </header>

          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={mode === 'deck'} className={mode === 'deck' ? 'on' : ''} onClick={() => setMode('deck')}>
              <DeckIcon />
              {t('Pick from the deck')}
            </button>
            <button role="tab" aria-selected={mode === 'own'} className={mode === 'own' ? 'on' : ''} onClick={() => setMode('own')}>
              <LayersIcon />
              {t('I drew real cards')}
            </button>
          </div>

          {spread && mode === 'deck' && (
            <>
              <p className="hint">{t('Take a breath, think of your question, and choose the cards that call to you.')}</p>
              <ol className="slots">
                {spread.positions.map((label, i) => (
                  <li key={label} className={picked[i] ? 'filled' : i === picked.length ? 'next' : ''}>
                    <span className="pos">
                      {i + 1}. {label}
                    </span>
                    {picked[i] ? <Face card={picked[i]} name={names[picked[i].id]} /> : <Blank />}
                  </li>
                ))}
              </ol>
              {shuffling ? (
                <div className="shuffle" role="status">
                  <div className="pile">
                    {Array.from({ length: PILE }, (_, i) => (
                      <i key={i} style={{ '--i': i, '--dir': i % 2 ? 1 : -1, backgroundImage: `url(${cardBack})` }} />
                    ))}
                  </div>
                  <p>{t('Shuffling the deck…')}</p>
                </div>
              ) : (
                <div className="fan" key={round} role="group" aria-label={t('The deck')}>
                  {order.map((_, index) => (
                    <button
                      key={index}
                      style={{ backgroundImage: `url(${cardBack})`, '--n': index }}
                      className={`back${picked.some((p) => p.index === index) ? ' taken' : ''}`}
                      disabled={picked.length >= total || picked.some((p) => p.index === index)}
                      onClick={() => pick(index)}
                      aria-label={t('Card {n}', { n: index + 1 })}
                    />
                  ))}
                </div>
              )}
              {drawn ? (
                <p className="locked">{t('The cards are drawn and cannot be redrawn.')}</p>
              ) : (
                <div className="row">
                  <button className="ghost" onClick={() => setPicked(picked.slice(0, -1))} disabled={!picked.length || shuffling}>
                    <UndoIcon />
                    {t('Undo last')}
                  </button>
                  <button className="ghost" onClick={reshuffle} disabled={shuffling}>
                    <ShuffleIcon />
                    {t('Shuffle again')}
                  </button>
                </div>
              )}
            </>
          )}

          {spread && mode === 'own' && (
            <>
              <p className="hint">{t('Shuffle and draw your own deck, then tell us which cards came out.')}</p>
              <ol className="own">
                {spread.positions.map((label, i) => (
                  <li key={label}>
                    <label className="pick">
                      <span className="pos">
                        {i + 1}. {label}
                      </span>
                      <select value={own[i]?.id ?? ''} onChange={(e) => setOwnAt(i, { id: e.target.value })}>
                        <option value="">{t('Choose a card')}</option>
                        {names.map((n, id) => (
                          <option key={id} value={id} disabled={usedOwn.has(String(id)) && String(id) !== own[i]?.id}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    {own[i]?.id ? (
                      <img className={`mini${own[i].reversed ? ' rev' : ''}`} src={cardImage(Number(own[i].id))} alt={names[own[i].id]} />
                    ) : (
                      <span className="mini empty" aria-hidden="true" />
                    )}
                    <label className="check">
                      <input type="checkbox" checked={own[i]?.reversed ?? false} onChange={(e) => setOwnAt(i, { reversed: e.target.checked })} />
                      <span>{t('Reversed')}</span>
                    </label>
                  </li>
                ))}
              </ol>
            </>
          )}

          <label className="q">
            <span>{t('Your question (optional)')}</span>
            <div className="field">
              <FeatherIcon />
              <textarea value={question} maxLength={500} rows={1} onChange={(e) => setQuestion(e.target.value)} placeholder={t('What do you want to understand?')} />
            </div>
          </label>

          {error && (
            <p className="err" role="alert">
              {error}
            </p>
          )}
          <button className="go" disabled={!complete || busy} onClick={reveal}>
            <SparkleIcon />
            {busy ? t('Reading the cards…') : t('Reveal my reading')}
          </button>
    </Frame>
  )
}
