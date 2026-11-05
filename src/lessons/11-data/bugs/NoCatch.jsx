import { useEffect, useState } from 'react'
import { fakeFetch } from '../../fakeApi.js'

export default function NoCatch() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fakeFetch('/users/1', { delay: 500, fail: true })
      .then((res) => res.json())
      .then(setUser)
  }, [])

  if (!user) return <p>⏳ Завантаження…</p>
  return <p>{user.name}</p>
}
