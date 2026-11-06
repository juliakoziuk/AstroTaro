import { memo, useState } from 'react'
import { RenderBadge } from '../../ui.jsx'

const Child = memo(function Child({ onSave }) {
  return (
    <p>
      <button onClick={onSave}>Зберегти</button> <RenderBadge label="Дитина оновилась" />
    </p>
  )
})

export default function InlineFnBreaksMemo() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Лічильник батька: {count}</button>
      <Child onSave={() => console.log('saved')} />
    </div>
  )
}
