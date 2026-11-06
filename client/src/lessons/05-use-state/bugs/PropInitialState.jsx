import { useState } from 'react'

function Child({ start }) {
  const [value] = useState(start)
  return <p>Дитина показує: {value}</p>
}

export default function PropInitialState() {
  const [n, setN] = useState(1)

  return (
    <div>
      <button onClick={() => setN(n + 1)}>Батько: {n}</button>
      <Child start={n} />
    </div>
  )
}
