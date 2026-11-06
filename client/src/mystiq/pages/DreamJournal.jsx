import { useState } from 'react'
import { useMystiq } from '../storeCore.js'
import { relativeDay, newId, nowIso } from '../dates.js'
import { Chip, PageHead, Rule } from '../ui.jsx'
import { go } from '../useHashRoute.js'

const FEELINGS = ['Спокій', 'Захват', 'Цікавість', 'Тривога', 'Сум']
const SUGGESTED = ['вода', 'політ', 'будинок', 'дорога', 'дзеркало', 'ключ', 'падіння', 'вогонь', 'тварина', 'місяць']

function countSymbols(dreams) {
  const map = {}
  dreams.forEach((d) => d.symbols.forEach((s) => (map[s] = (map[s] || 0) + 1)))
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

export default function DreamJournal() {
  const { dreams, dispatch } = useMystiq()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [mood, setMood] = useState('Цікавість')
  const [symbols, setSymbols] = useState([])
  const [draft, setDraft] = useState('')

  const stats = countSymbols(dreams)
  const top = stats[0]

  function addSymbol(raw) {
    const s = raw.trim().toLowerCase()
    if (s && !symbols.includes(s)) setSymbols([...symbols, s])
    setDraft('')
  }

  function save(e) {
    e.preventDefault()
    if (!text.trim()) return
    dispatch({
      type: 'dream_added',
      dream: { id: newId('d'), date: nowIso(), title: title.trim() || 'Сон без назви', mood, text: text.trim(), symbols },
    })
    setTitle('')
    setText('')
    setSymbols([])
  }

  return (
    <>
      <PageHead title="Dream Journal">Запиши сон одразу після пробудження, поки він не розтанув. З часом образи, що повторюються, складуться в карту твоєї підсвідомості.</PageHead>

      <div className="mq-two">
        <section>
          <form className="mq-arch" onSubmit={save} aria-label="Новий сон">
            <h2>Новий запис</h2>
            <div className="mq-field">
              <label htmlFor="dt">Назва</label>
              <input id="dt" className="mq-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Як би ти назвала цей сон?" />
            </div>
            <div className="mq-field">
              <label htmlFor="dx">Що відбувалось</label>
              <textarea id="dx" className="mq-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Опиши образи, місця, людей, відчуття…" />
            </div>
            <div className="mq-field">
              <span className="mq-label">Емоція, з якою прокинулась</span>
              <div className="mq-chips">
                {FEELINGS.map((f) => (
                  <Chip key={f} active={mood === f} onClick={() => setMood(f)}>
                    {f}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="mq-field">
              <label htmlFor="ds">Образи та символи</label>
              <input
                id="ds"
                className="mq-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addSymbol(draft)
                  }
                }}
                placeholder="Напиши слово й натисни Enter"
              />
              <div className="mq-chips" style={{ marginTop: 8 }}>
                {symbols.map((s) => (
                  <Chip key={s} tone="glow" onClick={() => setSymbols(symbols.filter((x) => x !== s))}>
                    {s} ✕
                  </Chip>
                ))}
              </div>
              <div className="mq-chips" style={{ marginTop: 6 }}>
                {SUGGESTED.filter((s) => !symbols.includes(s)).map((s) => (
                  <Chip key={s} onClick={() => addSymbol(s)}>
                    + {s}
                  </Chip>
                ))}
              </div>
            </div>
            <button className="mq-btn mq-btn--lit" type="submit" disabled={!text.trim()}>
              Зберегти сон
            </button>
          </form>
        </section>

        <section className="mq-plaque" aria-label="Повторювані образи">
          <h2>Образи, що повертаються</h2>
          <div className="mq-symbols">
            {stats.slice(0, 12).map(([s, n]) => (
              <span key={s} style={{ fontSize: 18 + n * 7, opacity: 0.55 + Math.min(n, 4) * 0.12 }}>
                {s}
                <small>×{n}</small>
              </span>
            ))}
          </div>
          <Rule />
          {top && top[1] > 1 ? (
            <p>
              Образ «{top[0]}» повторюється {top[1]} рази у твоїх снах. Подивись, коли він з’являється: чи пов’язаний він із певним настроєм або подією дня? Повтори часто вказують на тему, яка просить уваги, але значення образу завжди твоє власне.
            </p>
          ) : (
            <p className="muted">Повторів поки немає. Після кількох записів тут з’являться образи, що повертаються.</p>
          )}
          <p className="mq-note">Це підказка для рефлексії, а не тлумачення «що сон означає».</p>
        </section>
      </div>

      <Rule />

      <section aria-label="Записані сни">
        {dreams.map((d) => (
          <article key={d.id} className="mq-entry">
            <h3>{d.title}</h3>
            <p className="when">
              {relativeDay(d.date)}, прокинулась із відчуттям «{d.mood.toLowerCase()}»
            </p>
            <p>{d.text}</p>
            <div className="mq-chips">
              {d.symbols.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
            <button className="mq-btn mq-btn--text" onClick={() => go('analysis/' + d.id)}>
              Аналіз сну
            </button>
          </article>
        ))}
      </section>
    </>
  )
}
