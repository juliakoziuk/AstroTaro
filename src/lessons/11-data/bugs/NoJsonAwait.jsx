import { useState } from 'react'
import { fakeFetch } from '../../fakeApi.js'

export default function NoJsonAwait() {
  const [user, setUser] = useState(null)

  async function load() {
    const res = await fakeFetch('/users/1', { delay: 200 })
    const data = res.json()
    setUser(data)
  }

  return (
    <div>
      <button onClick={load}>Завантажити користувача</button>
      <pre>{JSON.stringify(user)}</pre>
    </div>
  )
}
