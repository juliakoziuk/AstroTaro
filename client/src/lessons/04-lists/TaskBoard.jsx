import { useState } from 'react'

const initialTasks = [
  { id: 1, title: 'Прочитати урок про JSX', done: true },
  { id: 2, title: 'Виконати завдання з props', done: false },
  { id: 3, title: 'Пройти тест по спискам', done: false },
]

const FILTERS = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Активні' },
  { value: 'done', label: 'Виконані' },
]

export default function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [text, setText] = useState('')

  function addTask(e) {
    e.preventDefault()
    if (!text.trim()) return
    // новий масив: старі елементи + новий (не push!)
    setTasks([...tasks, { id: Date.now(), title: text.trim(), done: false }])
    setText('')
  }

  const toggleTask = (id) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const removeTask = (id) => setTasks(tasks.filter((t) => t.id !== id))

  // Список для показу ОБЧИСЛЮЄМО з tasks, окремо в state не зберігаємо
  const visible = tasks
    .filter((t) => filter === 'all' || (filter === 'done' ? t.done : !t.done))
    .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))

  const leftCount = tasks.filter((t) => !t.done).length

  return (
    <div>
      <form onSubmit={addTask} className="row">
        <input type="text" placeholder="Нова задача" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit">Додати</button>
      </form>

      <div className="row">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} disabled={filter === f.value}>
            {f.label}
          </button>
        ))}
        <input type="text" placeholder="Пошук…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {visible.length === 0 ? (
        <p className="muted">Нічого не знайдено 🙈</p>
      ) : (
        <ul className="list-plain">
          {visible.map((t) => (
            // key — на найзовнішому елементі, який повертає map; значення — стабільний id
            <li key={t.id}>
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
              <span className={t.done ? 'done' : ''}>{t.title}</span>
              <button onClick={() => removeTask(t.id)} style={{ marginLeft: 'auto' }}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="muted">
        Залишилось виконати: {leftCount} із {tasks.length}
        {leftCount === 0 && tasks.length > 0 && ' — усе зроблено! 🎉'}
      </p>
    </div>
  )
}
