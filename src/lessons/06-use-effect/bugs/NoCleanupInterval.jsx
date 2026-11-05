import { useEffect, useState } from 'react'

function Ticker({ onTick }) {
  useEffect(() => {
    setInterval(onTick, 1000)
  }, [])

  return <p>Таймер працює…</p>
}

export default function NoCleanupInterval() {
  const [show, setShow] = useState(true)
  const [ticks, setTicks] = useState(0)

  return (
    <div>
      <button onClick={() => setShow(!show)}>{show ? 'Сховати' : 'Показати'} таймер</button>
      <p>Тіків отримав батько: {ticks}</p>
      {show && <Ticker onTick={() => setTicks((t) => t + 1)} />}
    </div>
  )
}
