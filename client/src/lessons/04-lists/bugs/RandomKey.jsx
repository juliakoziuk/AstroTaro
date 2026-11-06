import { useState } from 'react'

export default function RandomKey() {
  const [clicks, setClicks] = useState(0)
  const items = ['Яблука', 'Банани']

  return (
    <div>
      <button onClick={() => setClicks(clicks + 1)}>Перерендерити ({clicks})</button>
      <ul>
        {items.map((item) => (
          <li key={Math.random()}>
            {item}: <input type="text" />
          </li>
        ))}
      </ul>
    </div>
  )
}
