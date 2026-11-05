import { useEffect, useState } from 'react'
import { getUser } from '../fakeApi.js'

// Завантаження даних при зміні id: з прапорцем ignore проти «гонки запитів»
export default function UserLoader() {
  const [id, setId] = useState(1)
  const [state, setState] = useState({ status: 'loading', user: null, error: null })

  // «Завантаження» вмикаємо в обробнику події, а не синхронно на початку ефекту
  function selectUser(n) {
    setId(n)
    setState({ status: 'loading', user: null, error: null })
  }

  useEffect(() => {
    let ignore = false

    getUser(id)
      .then((user) => {
        if (!ignore) setState({ status: 'success', user, error: null })
      })
      .catch((error) => {
        if (!ignore) setState({ status: 'error', user: null, error })
      })

    // cleanup запускається, коли id змінився: відповіді «застарілого» запиту ігноруємо
    return () => {
      ignore = true
    }
  }, [id])

  return (
    <div>
      <div className="row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => selectUser(n)} disabled={n === id}>
            Користувач {n}
          </button>
        ))}
      </div>
      <p className="muted">№1 відповідає 1,5 с (повільний), інші 0,3 с; №5 не існує.</p>

      {state.status === 'loading' && <p>⏳ Завантаження…</p>}
      {state.status === 'error' && <p className="err">Помилка: {state.error.message}</p>}
      {state.status === 'success' && (
        <div className="card">
          <h4>{state.user.name}</h4>
          <div className="muted">
            {state.user.city} · {state.user.email}
          </div>
        </div>
      )}
    </div>
  )
}
