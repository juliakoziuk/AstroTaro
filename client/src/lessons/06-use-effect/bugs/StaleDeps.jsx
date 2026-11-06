import { useEffect, useState } from 'react'

export default function StaleDeps() {
  const [count, setCount] = useState(0)
  const [doubled, setDoubled] = useState(0)

  useEffect(() => {
    setDoubled(count * 2)
  }, [])

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <p>
        count = {count}, doubled = {doubled}
      </p>
    </div>
  )
}
