import { useState } from 'react'
import { useMystiq } from '../storeCore.js'
import { MOODS } from '../moods.js'
import { TODAY, dayKey, relativeDay, newId, nowIso } from '../dates.js'
import { CARDS } from '../tarotData.js'
import { Chip, PageHead, Rule } from '../ui.jsx'

export default function InnerJournal() {
  const { journal, dreams, spreads, dispatch } = useMystiq()
  const [mood, setMood] = useState(3)
  const [text, setText] = useState('')
  const [links, setLinks] = useState([])

  // 28 останніх днів: колір дня = середній настрій
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(TODAY)
    d.setDate(d.getDate() - (27 - i))
    const items = journal.filter((e) => dayKey(e.date) === dayKey(d))
    const avg = items.length ? Math.round(items.reduce((s, e) => s + e.mood, 0) / items.length) : null
    return { key: dayKey(d), avg }
  })

  const linkable = [
    ...dreams.slice(0, 3).map((d) => ({ type: 'dream', id: d.id, label: `Сон «${d.title}»` })),
    ...spreads.slice(0, 3).map((s) => ({ type: 'spread', id: s.id, label: `Розклад «${CARDS.find((c) => c.n === s.cards[0].id)?.name ?? ''}»` })),
  ]
  const isLinked = (l) => links.some((x) => x.type === l.type && x.id === l.id)

  function toggleLink(l) {
    setLinks(isLinked(l) ? links.filter((x) => !(x.type === l.type && x.id === l.id)) : [...links, { type: l.type, id: l.id }])
  }

  function save(e) {
    e.preventDefault()
    if (!text.trim()) return
    dispatch({ type: 'journal_added', entry: { id: newId('j'), date: nowIso(), mood, text: text.trim(), links } })
    setText('')
    setLinks([])
  }

  const linkLabel = (l) => {
    if (l.type === 'dream') return `Сон «${dreams.find((d) => d.id === l.id)?.title ?? '…'}»`
    const s = spreads.find((x) => x.id === l.id)
    return `Розклад «${CARDS.find((c) => c.n === s?.cards[0].id)?.name ?? '…'}»`
  }

  return (
    <>
      <PageHead title="Inner Journal">Одне чесне речення щодня краще за сторінку, написану раз на місяць. Тут ти відстежуєш настрій і зв’язуєш події зі снами та розкладами.</PageHead>

      <div className="mq-two">
        <form className="mq-arch" onSubmit={save} aria-label="Новий запис">
          <h2>Як ти сьогодні?</h2>
          <div className="mq-moods" role="radiogroup" aria-label="Настрій">
            {MOODS.map((m) => (
              <button key={m.value} type="button" role="radio" aria-checked={mood === m.value} className={`mq-mood-btn ${mood === m.value ? 'is-on' : ''}`} style={{ '--c': m.color }} onClick={() => setMood(m.value)}>
                <i />
                {m.label}
              </button>
            ))}
          </div>
          <div className="mq-field">
            <label htmlFor="jt">Запис</label>
            <textarea id="jt" className="mq-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Що сьогодні було важливим? Що ти відчуваєш?" />
          </div>
          <div className="mq-field">
            <span className="mq-label">Пов’язати з недавнім</span>
            <div className="mq-links">
              {linkable.map((l) => (
                <Chip key={`${l.type}-${l.id}`} active={isLinked(l)} onClick={() => toggleLink(l)}>
                  {l.label}
                </Chip>
              ))}
            </div>
          </div>
          <button className="mq-btn mq-btn--lit" type="submit" disabled={!text.trim()}>
            Зберегти запис
          </button>
        </form>

        <section className="mq-plaque" aria-label="Календар настрою">
          <h2>Останні чотири тижні</h2>
          <div className="mq-heat">
            {days.map((d) => (
              <i key={d.key} className={d.avg ? 'has' : ''} style={d.avg ? { '--c': MOODS[d.avg - 1].color } : undefined} title={d.avg ? MOODS[d.avg - 1].label : 'без запису'} />
            ))}
          </div>
          <div className="mq-chips" style={{ marginTop: 16 }}>
            {MOODS.map((m) => (
              <span key={m.value} className="mq-chip" style={{ gap: 8 }}>
                <i style={{ width: 9, height: 9, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                {m.label}
              </span>
            ))}
          </div>
          <p className="mq-note">Кожне коло — це день. Порожнє означає, що запису не було, і це нормально.</p>
        </section>
      </div>

      <Rule />

      <section aria-label="Записи">
        {journal.map((e) => (
          <article key={e.id} className="mq-entry">
            <p className="when">
              {relativeDay(e.date)}, настрій «{MOODS[e.mood - 1].label.toLowerCase()}»
            </p>
            <p>{e.text}</p>
            {e.links.length > 0 && (
              <div className="mq-chips">
                {e.links.map((l) => (
                  <Chip key={`${l.type}-${l.id}`} tone="glow">
                    {linkLabel(l)}
                  </Chip>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </>
  )
}
