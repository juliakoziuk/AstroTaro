import { useEffect, useState } from 'react'
import { fakeFetch } from '../../fakeApi.js'

export default function NoOkCheck() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fakeFetch('/users/99', { delay: 300 })
      .then((res) => res.json())
      .then(setUser)
  }, [])

  if (!user) return <p>⏳ Завантаження…</p>

  return (
    <p>
      Користувач: «{user.name}», місто: «{user.city}»
    </p>
  )
}
