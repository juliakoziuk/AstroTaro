import { useState } from 'react'
import { useMystiq } from '../storeCore.js'
import { CARDS, SPREADS } from '../tarotData.js'
import TarotCard from '../TarotCard.jsx'
import { PageHead, Typewriter } from '../ui.jsx'
import { newId, nowIso } from '../dates.js'
import { go } from '../useHashRoute.js'
import { composeReading } from './composeReading.js'

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TarotStudio() {
  const { dispatch } = useMystiq()
  const [spreadId, setSpreadId] = useState('three')
  const [question, setQuestion] = useState('')
  const [deck, setDeck] = useState(() => shuffle(CARDS))
  const [drawn, setDrawn] = useState([])
  const [reading, setReading] = useState(null)
  const [shuffling, setShuffling] = useState(false)

  const spread = SPREADS.find((s) => s.id === spreadId)
  const remaining = deck.filter((c) => !drawn.some((d) => d.card.n === c.n))
  const complete = drawn.length === spread.slots.length && drawn.every((d) => d.flipped)

  function reset(nextSpread = spreadId) {
    setSpreadId(nextSpread)
    setDrawn([])
    setReading(null)
    setDeck(shuffle(CARDS))
    setShuffling(true)
    setTimeout(() => setShuffling(false), 700)
  }

  function pick(card) {
    if (drawn.length >= spread.slots.length || reading) return
    setDrawn((d) => [...d, { card, reversed: Math.random() < 0.25, flipped: false }])
    setTimeout(() => setDrawn((d) => d.map((x) => (x.card.n === card.n ? { ...x, flipped: true } : x))), 140)
  }

  function interpret() {
    const text = composeReading(spread, drawn, question.trim())
    setReading(text)
    dispatch({
      type: 'spread_added',
      spread: {
        id: newId('s'),
        date: nowIso(),
        spreadId: spread.id,
        question: question.trim(),
        cards: drawn.map((d) => ({ id: d.card.n, reversed: d.reversed })),
      },
    })
  }

  return (
    <>
      <PageHead title="Tarot Studio">Постав питання або просто тримай у думках тему. Обери розклад і дай інтуїції вибрати карти.</PageHead>

      <div className="mq-spread-pick" role="radiogroup" aria-label="Розклад">
        {SPREADS.map((s) => (
          <button key={s.id} role="radio" aria-checked={s.id === spreadId} className={s.id === spreadId ? 'is-on' : ''} onClick={() => reset(s.id)}>
            <strong>{s.name}</strong>
            <span>{s.desc}</span>
          </button>
        ))}
      </div>

      <div className="mq-field" style={{ maxWidth: 560 }}>
        <label htmlFor="q">Твоє питання (необов’язково)</label>
        <input id="q" className="mq-input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Що мені варто зрозуміти зараз?" disabled={!!reading} />
      </div>

      <section className="mq-plaque" aria-label="Стіл розкладу">
        <div className="mq-table">
          {spread.slots.map((slot, i) => {
            const d = drawn[i]
            return (
              <div className="mq-slot" key={slot}>
                {d ? (
                  <TarotCard card={d.card} reversed={d.reversed} flipped={d.flipped} width={spread.slots.length > 3 ? 138 : 164} />
                ) : (
                  <div className="mq-slot-empty" style={spread.slots.length > 3 ? { width: 138 } : { width: 164 }}>
                    {i === drawn.length ? 'обери карту' : ''}
                  </div>
                )}
                <span className="mq-slot-label">{slot}</span>
                {d && (
                  <span className="muted small">
                    {d.card.name}
                    {d.reversed ? ', перевернута' : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {!reading && drawn.length < spread.slots.length && (
          <>
            <p className="muted" style={{ textAlign: 'center' }}>
              Обери карту з колоди ({drawn.length} з {spread.slots.length})
            </p>
            <div className={`mq-deck ${shuffling ? 'is-shuffling' : ''}`}>
              {remaining.map((c, i) => (
                <TarotCard
                  key={c.n}
                  card={c}
                  flipped={false}
                  width={92}
                  onClick={() => pick(c)}
                  style={{ '--r': `${(i - remaining.length / 2) * 1.6}deg`, '--sx': `${20 + (i % 5) * 8}px` }}
                />
              ))}
            </div>
          </>
        )}

        <div className="mq-row" style={{ justifyContent: 'center', marginTop: 8 }}>
          {complete && !reading && (
            <button className="mq-btn mq-btn--lit" onClick={interpret}>
              Отримати тлумачення
            </button>
          )}
          <button className="mq-btn" onClick={() => reset()}>
            {drawn.length || reading ? 'Почати знову' : 'Перетасувати колоду'}
          </button>
        </div>
      </section>

      {reading && (
        <section className="mq-arch" style={{ marginTop: 34 }} aria-label="Тлумачення">
          <div className="mq-reading">
            <h2>Тлумачення</h2>
            <div style={{ whiteSpace: 'pre-line' }}>
              <Typewriter key={reading} text={reading} speed={14} />
            </div>
            <div className="mq-row" style={{ marginTop: 14 }}>
              <button className="mq-btn mq-btn--lit" onClick={() => go('reading')}>
                Відкрити результат
              </button>
            </div>
            <p className="mq-note">Розклад збережено в My History. Тлумачення складене за значеннями карт і не є передбаченням.</p>
          </div>
        </section>
      )}
    </>
  )
}
