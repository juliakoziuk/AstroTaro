import { useEffect, useRef, useState } from 'react'

// Секундомір: id таймера лежить у ref — він має пережити рендери, але не впливає на розмітку
export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0) // мс
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)
  const startedAtRef = useRef(0)

  function start() {
    if (running) return
    startedAtRef.current = Date.now() - elapsed
    intervalRef.current = setInterval(() => setElapsed(Date.now() - startedAtRef.current), 100)
    setRunning(true)
  }

  function stop() {
    clearInterval(intervalRef.current)
    setRunning(false)
  }

  function reset() {
    stop()
    setElapsed(0)
  }

  // прибрати таймер, якщо компонент зникне, поки секундомір іде
  useEffect(() => () => clearInterval(intervalRef.current), [])

  return (
    <div className="row">
      <strong style={{ fontFamily: 'monospace', fontSize: 22 }}>{(elapsed / 1000).toFixed(1)} c</strong>
      <button onClick={start} disabled={running}>
        Старт
      </button>
      <button onClick={stop} disabled={!running}>
        Стоп
      </button>
      <button onClick={reset}>Скинути</button>
    </div>
  )
}
