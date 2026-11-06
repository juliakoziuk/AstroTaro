import { useEffect, useState } from 'react'
import { getUser } from '../../fakeApi.js'

export default function RaceCondition() {
  const [id, setId] = useState(2)
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser(id).then((u) => setUser(u))
  }, [id])

  return (
    <div>
      <button onClick={() => setId(1)}>Користувач 1 (повільний)</button>{' '}
      <button onClick={() => setId(2)}>Користувач 2 (швидкий)</button>
      <p>Вибрано id: {id}</p>
      <p>Показано: {user ? user.name : '…'}</p>
    </div>
  )
}
