import { useState } from 'react'

export default function ReadAfterSet() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')

  function increment() {
    setCount(count + 1)
    setMessage('Тепер лічильник = ' + count)
  }

  return (
    <div>
      <button onClick={increment}>+1</button>
      <p>Лічильник: {count}</p>
      <p>{message}</p>
    </div>
  )
}
