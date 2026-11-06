import { useState } from 'react'

// Різні події: клік, спливання (bubbling), клавіатура, preventDefault
export default function EventsDemo() {
  const [log, setLog] = useState([])
  const [query, setQuery] = useState('')

  const add = (text) => setLog((prev) => [text, ...prev].slice(0, 5))

  return (
    <div>
      <div className="card" onClick={() => add('клік дійшов до БАТЬКА (div.card)')}>
        <div className="row">
          <button onClick={() => add('кнопка 1: звичайний клік')}>Клік (спливає до батька)</button>
          <button
            onClick={(e) => {
              e.stopPropagation() // зупиняємо спливання: батько не дізнається
              add('кнопка 2: stopPropagation')
            }}
          >
            Клік зі stopPropagation
          </button>
          <a
            href="https://react.dev"
            onClick={(e) => {
              e.preventDefault() // не переходимо за посиланням
              add('посилання: preventDefault, перехід скасовано')
            }}
          >
            react.dev
          </a>
        </div>
      </div>

      <div className="field">
        <label htmlFor="q">Пошук (Esc очищає, Enter — шукає)</label>
        <input
          id="q"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('')
            if (e.key === 'Enter') add(`шукаємо: «${query}»`)
          }}
        />
      </div>

      <ol>
        {log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
    </div>
  )
}
