import { useEffect, useState } from 'react'
import { getUsers } from '../../fakeApi.js'

export default function LoadingNeverReset() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    getUsers({ fail: true, delay: 500 })
      .then((data) => {
        setUsers(data)
        setLoading(false)
      })
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      {loading && <p>⏳ Завантаження…</p>}
      {error && <p className="err">Помилка: {error}</p>}
      <p>Користувачів: {users.length}</p>
    </div>
  )
}
