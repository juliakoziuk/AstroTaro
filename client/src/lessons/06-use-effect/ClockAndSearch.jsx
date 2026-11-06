import { useEffect, useState } from 'react'

function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id) // cleanup: без нього таймер працював би й після зникнення компонента
  }, [])

  return <strong>{now.toLocaleTimeString('uk-UA')}</strong>
}

function WindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return <strong>{width}px</strong>
}

// Debounce: чекаємо 500 мс після останнього символу, а потім «шукаємо»
function DebouncedSearch() {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState('')

  useEffect(() => {
    if (!query) return
    const id = setTimeout(() => setSearched(query), 500)
    return () => clearTimeout(id) // новий символ скасовує попередній таймер
  }, [query])

  return (
    <div>
      <input type="text" placeholder="Друкуй швидко…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p className="muted">
        Шукаємо (після паузи 0,5 с): <strong>{searched || '—'}</strong>
      </p>
    </div>
  )
}

export default function ClockAndSearch() {
  return (
    <div>
      <p>
        Годинник: <Clock />
      </p>
      <p>
        Ширина вікна (змінюй розмір): <WindowWidth />
      </p>
      <DebouncedSearch />
    </div>
  )
}
