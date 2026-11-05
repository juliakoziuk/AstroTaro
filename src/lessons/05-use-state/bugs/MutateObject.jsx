import { useState } from 'react'

export default function MutateObject() {
  const [user, setUser] = useState({ name: 'Оля', age: 20 })

  function birthday() {
    user.age++
    setUser(user)
  }

  return (
    <div>
      <p>
        {user.name}, {user.age} років
      </p>
      <button onClick={birthday}>З днем народження</button>
    </div>
  )
}
