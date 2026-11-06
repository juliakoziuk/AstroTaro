import { useState } from 'react'
import { SIGNS, ELEMENTS, glyphOf, computeChart, compatibility, moonInfo, moonSign, signIndex, upcomingMoons, formatDay } from '../astro.js'
import { TODAY } from '../dates.js'
import MoonPhase from '../MoonPhase.jsx'
import { Chip, PageHead } from '../ui.jsx'

const toRad = (deg) => (deg * Math.PI) / 180

// Натальна карта: зодіакальне коло, будинки, планети й аспекти
function NatalChart({ chart }) {
  const c = 200
  const pos = (lon, r) => {
    const a = toRad(180 - (lon - chart.asc))
    return [c + r * Math.cos(a), c - r * Math.sin(a)]
  }
  // розсуваємо планети, що збігаються за довготою
  const sorted = [...chart.planets].sort((a, b) => a.lon - b.lon)
  const placed = []
  sorted.forEach((p) => {
    let lon = p.lon
    const prev = placed[placed.length - 1]
    if (prev && lon - prev.show < 9) lon = prev.show + 9
    placed.push({ ...p, show: lon })
  })
  const byKey = Object.fromEntries(placed.map((p) => [p.key, p]))

  return (
    <svg viewBox="0 0 400 400" className="mq-chart" role="img" aria-label="Натальна карта">
      <circle cx={c} cy={c} r="192" fill="rgba(8,10,38,0.55)" stroke="rgba(217,181,106,0.55)" />
      <circle cx={c} cy={c} r="160" fill="none" stroke="rgba(217,181,106,0.4)" />
      <circle cx={c} cy={c} r="124" fill="none" stroke="rgba(217,181,106,0.25)" />
      <circle cx={c} cy={c} r="70" fill="none" stroke="rgba(217,181,106,0.25)" strokeDasharray="2 4" />
      {SIGNS.map((s, i) => {
        const [x1, y1] = pos(i * 30, 160)
        const [x2, y2] = pos(i * 30, 192)
        const [gx, gy] = pos(i * 30 + 15, 176)
        return (
          <g key={s.name}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(217,181,106,0.4)" />
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" fontSize="17" fill="#f3dfa8" fontFamily="'Segoe UI Symbol','Noto Sans Symbols',serif">
              {glyphOf(s)}
            </text>
          </g>
        )
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = pos(chart.asc + i * 30, 124)
        const [x2, y2] = pos(chart.asc + i * 30, 70)
        const [nx, ny] = pos(chart.asc + i * 30 + 15, 96)
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(217,181,106,0.22)" />
            <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fontSize="8" fill="rgba(155,147,185,0.8)">
              {i + 1}
            </text>
          </g>
        )
      })}
      {chart.aspects.map((a, i) => {
        const [x1, y1] = pos(a.a.lon, 70)
        const [x2, y2] = pos(a.b.lon, 70)
        const color = a.angle === 120 || a.angle === 60 ? 'rgba(143,200,214,0.65)' : 'rgba(229,138,164,0.6)'
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.9" />
      })}
      {chart.planets.map((p) => {
        const [tx, ty] = pos(p.lon, 124)
        const [ux, uy] = pos(p.lon, 118)
        const [x, y] = pos(byKey[p.key].show, 142)
        return (
          <g key={p.key}>
            <line x1={tx} y1={ty} x2={ux} y2={uy} stroke="#d9b56a" />
            <circle cx={x} cy={y} r="11" fill="#0b0716" stroke="rgba(217,181,106,0.6)" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#f3dfa8" fontFamily="'Segoe UI Symbol','Noto Sans Symbols',serif">
              {p.glyph + '︎'}
            </text>
          </g>
        )
      })}
      <text x="8" y="196" fontSize="9" fill="#f3dfa8">ASC</text>
    </svg>
  )
}

function Ring({ value }) {
  const r = 78
  const len = 2 * Math.PI * r
  return (
    <div className="mq-ring">
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(217,181,106,0.18)" strokeWidth="2" />
        <circle cx="90" cy="90" r={r} fill="none" stroke="#f3dfa8" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${(len * value) / 100} ${len}`} style={{ filter: 'drop-shadow(0 0 6px rgba(243,223,168,0.7))' }} />
      </svg>
      <strong>{value}%</strong>
    </div>
  )
}

export default function Astrology() {
  const [tab, setTab] = useState('chart')
  const [date, setDate] = useState('1996-04-12')
  const [time, setTime] = useState('10:30')
  const [place, setPlace] = useState('Київ')
  const [a, setA] = useState(0)
  const [b, setB] = useState(6)

  const chart = computeChart(date, time)
  const match = compatibility(a, b)
  const moon = moonInfo(TODAY)
  const events = upcomingMoons(TODAY, 4)

  const describe = (lon) => `${SIGNS[signIndex(lon)].name}, ${Math.floor(lon % 30)}°`

  return (
    <>
      <PageHead title="Astrology">Натальна карта, сумісність і цикли Місяця. Астрологія тут: мова символів для рефлексії, а не наука й не вирок.</PageHead>

      <div className="mq-seg" role="tablist">
        {[['chart', 'Натальна карта'], ['match', 'Сумісність'], ['cycles', 'Цикли']].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'chart' && (
        <div className="mq-chart-wrap">
          <NatalChart chart={chart} />
          <div>
            <div className="mq-row" style={{ alignItems: 'flex-end', marginBottom: 16 }}>
              <div className="mq-field" style={{ marginBottom: 0 }}>
                <label htmlFor="bd">Дата народження</label>
                <input id="bd" type="date" className="mq-input" value={date} onChange={(e) => setDate(e.target.value || '1996-04-12')} />
              </div>
              <div className="mq-field" style={{ marginBottom: 0 }}>
                <label htmlFor="bt">Час</label>
                <input id="bt" type="time" className="mq-input" value={time} onChange={(e) => setTime(e.target.value || '12:00')} />
              </div>
              <div className="mq-field" style={{ marginBottom: 0 }}>
                <label htmlFor="bp">Місце</label>
                <input id="bp" className="mq-input" value={place} onChange={(e) => setPlace(e.target.value)} />
              </div>
            </div>
            <div className="mq-chips" style={{ margin: '18px 0' }}>
              <Chip tone="glow">Сонце: {chart.sun.name}</Chip>
              <Chip tone="glow">Місяць: {chart.moon.name}</Chip>
              <Chip tone="glow">Асцендент: {chart.rising.name}</Chip>
            </div>
            <table className="mq-table-plain">
              <thead>
                <tr>
                  <th />
                  <th>Планета</th>
                  <th>Положення</th>
                </tr>
              </thead>
              <tbody>
                {chart.planets.map((p) => (
                  <tr key={p.key}>
                    <td className="g">{p.glyph + '︎'}</td>
                    <td>{p.name}</td>
                    <td>
                      {describe(p.lon)}
                      {p.demo && <span className="muted small"> (приклад)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mq-note">
              Сонце, Місяць і асцендент для {place || 'обраного місця'} рахуються наближено. Положення інших планет у прототипі — демонстраційні; для точної карти потрібні ефемериди.
            </p>
          </div>
        </div>
      )}

      {tab === 'match' && (
        <div className="mq-two">
          <section className="mq-plaque">
            <h2>Обери два знаки</h2>
            <div className="mq-row" style={{ gap: 28 }}>
              {[[a, setA, 'Перший знак'], [b, setB, 'Другий знак']].map(([val, set, label]) => (
                <div className="mq-field" key={label} style={{ flex: 1, minWidth: 150 }}>
                  <label htmlFor={label}>{label}</label>
                  <select id={label} className="mq-select" value={val} onChange={(e) => set(Number(e.target.value))}>
                    {SIGNS.map((s, i) => (
                      <option key={s.name} value={i}>
                        {glyphOf(s)} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="muted small">
              {SIGNS[a].name}: {ELEMENTS[SIGNS[a].element].toLowerCase()}. {SIGNS[b].name}: {ELEMENTS[SIGNS[b].element].toLowerCase()}.
            </p>
          </section>
          <section className="mq-orb" style={{ justifySelf: 'center' }}>
            <div>
              <Ring value={match.score} />
              <p style={{ maxWidth: 30 + 'ch', margin: '10px auto 0' }}>{match.text}</p>
            </div>
          </section>
        </div>
      )}

      {tab === 'cycles' && (
        <div className="mq-two">
          <section className="mq-orb" style={{ justifySelf: 'center', width: 340, aspectRatio: '1' }}>
            <div>
              <MoonPhase date={TODAY} size={170} />
              <h2 style={{ margin: '4px 0 2px' }}>{moon.name}</h2>
              <p className="muted">
                Місяць у знаку {moonSign(TODAY).name} {glyphOf(moonSign(TODAY))}, освітлено {Math.round(moon.illumination * 100)} %
              </p>
            </div>
          </section>
          <section className="mq-plaque">
            <h2>Найближчі фази</h2>
            {events.map((e) => (
              <div className="mq-cycle" key={e.date.toISOString()}>
                <MoonPhase date={e.date} size={42} />
                <div>
                  <div className="display" style={{ fontSize: 20 }}>
                    {e.type === 'new' ? 'Новий Місяць' : 'Повний Місяць'}
                  </div>
                  <div className="muted small">{e.type === 'new' ? 'час намірів і нових починань' : 'час підсумків і відпускання'}</div>
                </div>
                <div className="muted">{formatDay(e.date)}</div>
              </div>
            ))}
            <p className="mq-note">Дати розраховані за середнім місячним циклом і можуть відрізнятись від точних на кілька годин.</p>
          </section>
        </div>
      )}
    </>
  )
}
