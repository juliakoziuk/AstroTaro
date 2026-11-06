import { useState } from 'react'

export default function NumberString() {
  const [age, setAge] = useState(20)

  return (
    <div>
      <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
      <p>Через 10 років: {age + 10}</p>
    </div>
  )
}
