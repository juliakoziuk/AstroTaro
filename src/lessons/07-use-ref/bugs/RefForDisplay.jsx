import { useRef } from 'react'

export default function RefForDisplay() {
  const count = useRef(0)

  return (
    <div>
      <button onClick={() => count.current++}>+1</button>
      <p>Кліків: {count.current}</p>
    </div>
  )
}
