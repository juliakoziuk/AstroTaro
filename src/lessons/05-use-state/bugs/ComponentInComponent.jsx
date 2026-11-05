import { useState } from 'react'

export default function ComponentInComponent() {
  const [clicks, setClicks] = useState(0)

  function Counter() {
    const [n, setN] = useState(0)
    return <button onClick={() => setN(n + 1)}>Внутрішній: {n}</button>
  }

  return (
    <div className="row">
      <button onClick={() => setClicks(clicks + 1)}>Батько: {clicks}</button>
      <Counter />
    </div>
  )
}
