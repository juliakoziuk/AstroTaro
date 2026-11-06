import { memo, useState } from 'react'
import { RenderBadge } from '../../ui.jsx'

const Panel = memo(function Panel({ children }) {
  return (
    <div className="card">
      {children} <RenderBadge label="Панель оновилась" />
    </div>
  )
})

export default function MemoWithChildren() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Лічильник батька: {count}</button>
      <Panel>
        <p>Статичний текст, який ніколи не змінюється</p>
      </Panel>
    </div>
  )
}
