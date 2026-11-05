import { memo, useState } from 'react'
import { RenderBadge } from '../../ui.jsx'

const Avatar = memo(function Avatar({ style }) {
  return (
    <p>
      <span style={style}>😀</span> <RenderBadge label="Аватар оновився" />
    </p>
  )
})

export default function InlineObjectBreaksMemo() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Лічильник батька: {count}</button>
      <Avatar style={{ fontSize: 24 }} />
    </div>
  )
}
