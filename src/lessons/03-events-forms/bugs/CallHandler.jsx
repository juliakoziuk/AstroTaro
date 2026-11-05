import { useState } from 'react'

export default function CallHandler() {
  const [count, setCount] = useState(0)

  function increment() {
    setCount(count + 1)
  }

  return <button onClick={increment()}>Клікнули: {count}</button>
}
