import { useState } from 'react'
import { useMystiq } from '../storeCore.js'
import { cardById, SPREADS } from '../tarotData.js'
import { MOODS } from '../moods.js'
import { relativeDay, daysAgoOf } from '../dates.js'
import { Chip, PageHead, Rule } from '../ui.jsx'

const FILTERS = [
  { id: 'all', label: 'Усе' },
  { id: 'tarot', label: 'Таро' },
  { id: 'dream', label: 'Сни' },
  { id: 'journal', label: 'Щоденник' },
]

const topOf = (list) => {
  const map = {}
  list.forEach((x) => (map[x] = (map[x] || 0) + 1))
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]
}

// «Сузір’я» образів: вузол — символ зі снів, лінія — вони зустрілись в одному сні
function Constellation({ dreams }) {
  const counts = {}
  dreams.forEach((d) => d.symbols.forEach((s) => (counts[s] = (counts[s] || 0) + 1)))
  const nodes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, n], i, arr) => {
      const a = (i / arr.length) * Math.PI * 2 - Math.PI / 2
      const jitter = Math.sin(i * 12.9) * 14
      return { name, n, x: 320 + Math.cos(a) * (230 + jitter), y: 170 + Math.sin(a) * (122 + jitter * 0.5) }
    })
  const byName = Object.fromEntries(nodes.map((n) => [n.name, n]))
  const edges = []
  dreams.forEach((d) => {
    const s = d.symbols.filter((x) => byName[x])
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) edges.push([byName[s[i]], byName[s[j]]])
  })

  return (
    <svg viewBox="0 0 640 340" className="mq-constellation" role="img" aria-label="Сузір’я образів зі снів">
      {edges.map(([a, b], i) => (
        <line key={i} className="edge" x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
      {nodes.map((n) => (
        <g key={n.name}>
          <circle cx={n.x} cy={n.y} r={4 + n.n * 3} fill="#f3dfa8" opacity="0.18" />
          <circle cx={n.x} cy={n.y} r={2 + n.n * 1.2} fill="#f3dfa8" style={{ filter: 'drop-shadow(0 0 5px rgba(243,223,168,0.9))' }} />
          <text x={n.x} y={n.y - 12 - n.n * 2} textAnchor="middle" fontSize="14" fontFamily="Forum, serif" fill="#e9e2d0">
            {n.name}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function History() {
  const { dreams, journal, spreads } = useMystiq()
  const [filter, setFilter] = useState('all')

  const events = [
    ...spreads.map((s) => ({
      kind: 'tarot',
      id: s.id,
      date: s.date,
      title: `Розклад «${SPREADS.find((x) => x.id === s.spreadId)?.name ?? ''}»`,
      text: `${s.question ? `«${s.question}». ` : ''}Карти: ${s.cards.map((c) => cardById(c.id)?.name + (c.reversed ? ' (перевернута)' : '')).join(', ')}`,
    })),
    ...dreams.map((d) => ({ kind: 'dream', id: d.id, date: d.date, title: d.title, text: `Образи: ${d.symbols.join(', ')}` })),
    ...journal.map((e) => ({ kind: 'journal', id: e.id, date: e.date, title: `Запис, настрій «${MOODS[e.mood - 1].label.toLowerCase()}»`, text: e.text })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const shown = filter === 'all' ? events : events.filter((e) => e.kind === filter)

  const topSymbol = topOf(dreams.flatMap((d) => d.symbols))
  const topCard = topOf(spreads.flatMap((s) => s.cards.map((c) => c.id)))
  const card = topCard && cardById(Number(topCard[0]))
  const recent = journal.filter((e) => daysAgoOf(e.date) < 7)
  const before = journal.filter((e) => daysAgoOf(e.date) >= 7 && daysAgoOf(e.date) < 14)
  const avg = (list) => (list.length ? list.reduce((s, e) => s + e.mood, 0) / list.length : null)
  const now = avg(recent)
  const prev = avg(before)
  let trend = 'Недостатньо записів, щоб порівняти тижні.'
  if (now != null && prev != null) trend = now > prev + 0.3 ? 'Цього тижня настрій світліший, ніж минулого.' : now < prev - 0.3 ? 'Цього тижня настрій важчий, ніж минулого. Будь до себе лагідною.' : 'Настрій тримається приблизно на тому самому рівні.'

  return (
    <>
      <PageHead title="My History">Усе, що ти записала й дослідила, в одній стрічці. Тут з’являються патерни, які важко помітити день за днем.</PageHead>

      <div className="mq-grid" style={{ marginBottom: 30 }}>
        <section className="mq-plaque span-4">
          <h2>Образ, що повертається</h2>
          <div className="mq-stat">{topSymbol ? topSymbol[0] : '—'}</div>
          <p className="muted">{topSymbol ? `з’являвся у ${topSymbol[1]} снах` : 'Запиши кілька снів'}</p>
        </section>
        <section className="mq-plaque span-4">
          <h2>Карта, що повторюється</h2>
          <div className="mq-stat">{card ? card.name : '—'}</div>
          <p className="muted">{card ? `випадала ${topCard[1]} р.` : 'Зроби кілька розкладів'}</p>
        </section>
        <section className="mq-plaque span-4">
          <h2>Настрій</h2>
          <p style={{ marginTop: 6 }}>{trend}</p>
        </section>
      </div>

      <section className="mq-arch" aria-label="Сузір’я образів" style={{ marginBottom: 34 }}>
        <h2>Сузір’я образів</h2>
        <Constellation dreams={dreams} />
        <p className="mq-note">Чим більший вузол, тим частіше образ повторюється у снах. Лінії з’єднують образи, що зустрілись в одному сні.</p>
      </section>

      <div className="mq-row" style={{ marginBottom: 22 }}>
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <Rule />

      <div className="mq-timeline">
        {shown.map((e) => (
          <article className="mq-event" data-kind={e.kind} key={e.id}>
            <h3>{e.title}</h3>
            <div className="when">{relativeDay(e.date)}</div>
            <p style={{ maxWidth: '64ch' }}>{e.text}</p>
          </article>
        ))}
        {shown.length === 0 && <p className="muted">Тут поки порожньо. Зроби розклад або запиши сон, і вони з’являться в стрічці.</p>}
      </div>
    </>
  )
}
