import { useState } from 'react'

export default function DoubleSet() {
  const [count, setCount] = useState(0)

  function addThree() {
    setCount(count + 1)
    setCount(count + 1)
    setCount(count + 1)
  }

  return (
    <div>
      <p>Лічильник: {count}</p>
      <button onClick={addThree}>+3</button>
    </div>
  )
}
