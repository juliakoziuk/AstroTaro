import { useEffect, useState } from 'react'
import { getUsers } from '../fakeApi.js'

const LOADING = { status: 'loading', users: [], error: null }

// Чотири стани екрана з даними: loading → success | error, плюс «порожньо»
export default function UsersList() {
  const [fail, setFail] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState(LOADING)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let ignore = false
    getUsers({ fail })
      .then((users) => {
        if (!ignore) setState({ status: 'success', users, error: null })
      })
      .catch((error) => {
        if (!ignore) setState({ status: 'error', users: [], error })
      })
    return () => {
      ignore = true
    }
  }, [attempt, fail])

  function reload() {
    setState(LOADING)
    setAttempt((a) => a + 1)
  }

  function toggleFail(e) {
    setFail(e.target.checked)
    setState(LOADING)
  }

  const visible = state.users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <div className="row">
        <label>
          <input type="checkbox" checked={fail} onChange={toggleFail} /> Імітувати помилку сервера
        </label>
        <button onClick={reload}>Оновити</button>
        <input type="text" placeholder="Пошук за ім’ям" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {state.status === 'loading' && <p>⏳ Завантаження…</p>}

      {state.status === 'error' && (
        <div className="crash">
          <strong>Не вдалося завантажити.</strong> {state.error.message}{' '}
          <button onClick={reload}>Спробувати ще раз</button>
        </div>
      )}

      {state.status === 'success' &&
        (visible.length === 0 ? (
          <p className="muted">Нікого не знайдено 🙈</p>
        ) : (
          <ul className="list-plain">
            {visible.map((u) => (
              <li key={u.id}>
                <strong>{u.name}</strong>
                <span className="muted">{u.city}</span>
                <span className="pill" style={{ marginLeft: 'auto' }}>
                  {u.posts} дописів
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
