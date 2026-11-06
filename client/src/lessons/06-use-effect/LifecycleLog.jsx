import { useCallback, useEffect, useState } from 'react'

// Віджет показує, коли саме спрацьовують ефекти та cleanup
function Widget({ value, log }) {
  useEffect(() => {
    log('✅ ефект []: компонент з’явився')
    return () => log('🧹 cleanup []: компонент зникає')
  }, [log])

  useEffect(() => {
    log(`🔁 ефект [value]: value = ${value}`)
    return () => log(`🧽 cleanup [value]: прибираємо за value = ${value}`)
  }, [log, value])

  return <p>Віджет живий, value = <strong>{value}</strong></p>
}

export default function LifecycleLog() {
  const [show, setShow] = useState(true)
  const [value, setValue] = useState(1)
  const [lines, setLines] = useState([])

  // стабільна функція (useCallback), щоб ефекти не перезапускались через зміну log
  const log = useCallback((text) => setLines((prev) => [...prev, text].slice(-14)), [])

  return (
    <div>
      <div className="row">
        <button onClick={() => setShow(!show)}>{show ? 'Прибрати віджет' : 'Показати віджет'}</button>
        <button onClick={() => setValue(value + 1)}>value + 1</button>
        <button onClick={() => setLines([])}>Очистити журнал</button>
      </div>
      {show && <Widget value={value} log={log} />}
      <ol className="muted">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      <p className="muted">
        У режимі розробки (StrictMode) React навмисно запускає ефект при монтуванні двічі «ефект → cleanup → ефект», щоб
        показати відсутній cleanup. У продакшені цього немає.
      </p>
    </div>
  )
}
