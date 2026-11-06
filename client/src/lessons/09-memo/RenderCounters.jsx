import { memo, useCallback, useState } from 'react'
import { RenderBadge } from '../ui.jsx'

// Без memo: перемальовується разом з батьком, навіть якщо props не змінились
function Plain() {
  return (
    <div className="card">
      Звичайний компонент <RenderBadge label="оновлень" />
    </div>
  )
}

// memo: React пропустить перемальовування, якщо props ті самі (порівняння поверхневе)
const Memoized = memo(function Memoized() {
  return (
    <div className="card">
      memo без props <RenderBadge label="оновлень" />
    </div>
  )
})

// memo + новий inline-обробник при кожному рендері → memo НЕ допомагає
const WithNewFunction = memo(function WithNewFunction({ onPing }) {
  return (
    <div className="card">
      <button onClick={onPing}>ping</button> memo + нова функція щоразу <RenderBadge label="оновлень" />
    </div>
  )
})

// memo + стабільна функція (useCallback) → працює
const WithStableFunction = memo(function WithStableFunction({ onPing }) {
  return (
    <div className="card">
      <button onClick={onPing}>ping</button> memo + useCallback <RenderBadge label="оновлень" />
    </div>
  )
})

export default function RenderCounters() {
  const [count, setCount] = useState(0)
  const [pings, setPings] = useState(0)

  const pingNew = () => setPings((p) => p + 1) // нова функція при кожному рендері
  const pingStable = useCallback(() => setPings((p) => p + 1), []) // та сама функція між рендерами

  return (
    <div>
      <div className="row">
        <button onClick={() => setCount(count + 1)}>Перерендерити батька ({count})</button>
        <span className="muted">pings: {pings}</span>
      </div>
      <Plain />
      <Memoized />
      <WithNewFunction onPing={pingNew} />
      <WithStableFunction onPing={pingStable} />
    </div>
  )
}
