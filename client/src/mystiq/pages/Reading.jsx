import { useMystiq } from '../storeCore.js'
import { cardById, SPREADS } from '../tarotData.js'
import { composeReading } from './composeReading.js'
import TarotCard from '../TarotCard.jsx'
import { PageHead } from '../ui.jsx'
import { go } from '../useHashRoute.js'
import { fullDate } from '../dates.js'

// Результат розкладу: останній збережений розклад із My History
export default function Reading() {
  const { spreads } = useMystiq()
  const s = spreads[0]

  if (!s) {
    return (
      <>
        <PageHead title="Результат розкладу">Розкладів ще немає. Зроби перший у Tarot Studio.</PageHead>
        <button className="mq-btn mq-btn--lit" onClick={() => go('tarot')}>Новий розклад</button>
      </>
    )
  }

  const spread = SPREADS.find((x) => x.id === s.spreadId) ?? SPREADS[0]
  const drawn = s.cards.map((c) => ({ card: cardById(c.id), reversed: c.reversed })).filter((d) => d.card)
  const text = composeReading(spread, drawn, s.question)
  const advice = drawn[drawn.length - 1]?.card.advice

  return (
    <>
      <PageHead title="Результат розкладу">
        {spread.name} · {fullDate(s.date)}
        {s.question ? ` · «${s.question}»` : ''}
      </PageHead>

      <div className="mq-reading-grid">
        <section className="mq-plaque" aria-label="Карти розкладу">
          <h2>Карти</h2>
          <div className="mq-table mq-table--flat">
            {drawn.map((d, i) => (
              <div className="mq-slot" key={d.card.n}>
                <TarotCard card={d.card} reversed={d.reversed} width={132} flipped />
                <span className="mq-slot-label">{spread.slots[i]}</span>
                <span className="muted small">{d.card.name}{d.reversed ? ', перевернута' : ''}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mq-plaque" aria-label="Тлумачення">
          <h2>AI-інтерпретація</h2>
          <div className="mq-prose" style={{ whiteSpace: 'pre-line' }}>{text}</div>
        </section>

        <section className="mq-plaque" aria-label="Значення карт">
          <h2>Значення карт</h2>
          <ul className="mq-meanings">
            {drawn.map((d) => (
              <li key={d.card.n}>
                <strong>{d.card.name}</strong>
                <span className="muted">{d.card.keywords.join(' · ')}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mq-plaque mq-tip" aria-label="Підказка">
          <h2>Підказка дня</h2>
          <p>{advice}</p>
          <div className="mq-row" style={{ marginTop: 16 }}>
            <button className="mq-btn mq-btn--lit" onClick={() => go('journal')}>Записати думку</button>
            <button className="mq-btn" onClick={() => go('tarot')}>Новий розклад</button>
          </div>
        </section>
      </div>
    </>
  )
}
