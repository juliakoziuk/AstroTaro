import { useEffect, useState } from 'react'

let runs = 0

export default function ObjectDep() {
  const [text, setText] = useState('')
  const options = { uppercase: true }

  useEffect(() => {
    runs += 1
  }, [options])

  return (
    <div>
      <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Друкуй…" />
      <p>Ефект виконався разів: {runs}</p>
    </div>
  )
}
