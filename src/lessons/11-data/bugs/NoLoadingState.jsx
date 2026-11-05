import { useEffect, useState } from 'react'
import { getUsers } from '../../fakeApi.js'

export default function NoLoadingState() {
  const [users, setUsers] = useState(null)

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}
