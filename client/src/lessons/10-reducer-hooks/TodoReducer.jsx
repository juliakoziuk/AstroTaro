import { useReducer, useState } from 'react'

// Reducer: чиста функція (state, action) → новий state. Уся логіка змін — в одному місці.
function todosReducer(state, action) {
  switch (action.type) {
    case 'added':
      return [...state, { id: action.id, title: action.title, done: false }]
    case 'toggled':
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))
    case 'removed':
      return state.filter((t) => t.id !== action.id)
    case 'cleared_done':
      return state.filter((t) => !t.done)
    default:
      throw new Error('Невідома дія: ' + action.type)
  }
}

const initialTodos = [
  { id: 1, title: 'Вивчити useReducer', done: false },
  { id: 2, title: 'Написати свій reducer', done: false },
]

export default function TodoReducer() {
  const [todos, dispatch] = useReducer(todosReducer, initialTodos)
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    dispatch({ type: 'added', id: Date.now(), title: text.trim() })
    setText('')
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="row">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Нова задача" />
        <button type="submit">Додати</button>
        <button type="button" onClick={() => dispatch({ type: 'cleared_done' })}>
          Прибрати виконані
        </button>
      </form>
      <ul className="list-plain">
        {todos.map((t) => (
          <li key={t.id}>
            <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'toggled', id: t.id })} />
            <span className={t.done ? 'done' : ''}>{t.title}</span>
            <button style={{ marginLeft: 'auto' }} onClick={() => dispatch({ type: 'removed', id: t.id })}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
