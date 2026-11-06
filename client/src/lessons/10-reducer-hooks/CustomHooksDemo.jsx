import { useEffect, useState } from 'react'

// Власний хук — звичайна функція, назва якої починається з use і яка викликає інші хуки.
function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = () => setValue((v) => !v)
  return [value, toggle]
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

export default function CustomHooksDemo() {
  const [open, toggleOpen] = useToggle(false)
  const [name, setName] = useLocalStorage('lesson10-name', '')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)

  return (
    <div>
      <div className="row">
        <button onClick={toggleOpen}>{open ? 'Сховати' : 'Показати'} деталі</button>
        {open && <span className="pill">useToggle працює</span>}
      </div>

      <div className="field">
        <label htmlFor="n10">Ім’я (збережеться після перезавантаження сторінки)</label>
        <input id="n10" type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="q10">Пошук (debounce 500 мс)</label>
        <input id="q10" type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="muted">
          Введено: «{query}» → «запит» полетить із: «{debouncedQuery}»
        </span>
      </div>
    </div>
  )
}
