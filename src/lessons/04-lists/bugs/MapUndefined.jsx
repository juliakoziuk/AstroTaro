import { useState } from 'react'

export default function MapUndefined() {
  // дані ще не завантажились — у state поки нічого немає
  const [users] = useState()

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
