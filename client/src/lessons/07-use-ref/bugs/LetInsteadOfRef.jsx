import { useState } from 'react'

export default function LetInsteadOfRef() {
  const [seconds, setSeconds] = useState(0)
  let intervalId = null

  function start() {
    // (обмеження до 10 — лише щоб демо не тікало вічно)
    intervalId = setInterval(() => setSeconds((s) => (s >= 10 ? s : s + 1)), 1000)
  }

  function stop() {
    clearInterval(intervalId)
  }

  return (
    <div className="row">
      <strong>{seconds} c</strong>
      <button onClick={start}>Старт</button>
      <button onClick={stop}>Стоп</button>
    </div>
  )
}
