import { memo, useMemo, useState } from 'react'
import { RenderBadge } from '../ui.jsx'

const ITEMS = [5, 3, 9, 1, 7]

const SortedList = memo(function SortedList({ title, items }) {
  return (
    <div className="card">
      <strong>{title}:</strong> {items.join(', ')} <RenderBadge label="оновлень" />
    </div>
  )
})

// Масив, обчислений з даних, — це НОВИЙ масив при кожному рендері. useMemo зберігає посилання.
export default function MemoValues() {
  const [text, setText] = useState('')

  const sortedEveryTime = [...ITEMS].sort((a, b) => a - b)
  const sortedMemo = useMemo(() => [...ITEMS].sort((a, b) => a - b), [])

  return (
    <div>
      <input type="text" placeholder="Друкуй сюди…" value={text} onChange={(e) => setText(e.target.value)} />
      <SortedList title="Без useMemo (новий масив щоразу)" items={sortedEveryTime} />
      <SortedList title="З useMemo (те саме посилання)" items={sortedMemo} />
      <p className="muted">
        Кожен символ у полі перемальовує батька. Перший список отримує новий масив і перемальовується разом з ним, другий —
        ні.
      </p>
    </div>
  )
}
