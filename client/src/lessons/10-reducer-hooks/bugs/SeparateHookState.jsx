import { useState } from 'react'

function useCounter() {
  const [count, setCount] = useState(0)
  return { count, increment: () => setCount(count + 1) }
}

function CounterButton() {
  const { count, increment } = useCounter()
  return <button onClick={increment}>Кнопка: {count}</button>
}

function CounterLabel() {
  const { count } = useCounter()
  return <strong>У заголовку: {count}</strong>
}

export default function SeparateHookState() {
  return (
    <div className="row">
      <CounterButton />
      <CounterLabel />
    </div>
  )
}
