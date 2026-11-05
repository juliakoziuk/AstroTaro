import { useState } from 'react'

const screens = {
  Home: { text: 'Головний екран' },
  Details: { text: 'Екран деталей' },
}

export default function BackAtRoot() {
  const [stack, setStack] = useState(['Home'])

  const go = (name) => setStack((s) => [...s, name])
  const goBack = () => setStack((s) => s.slice(0, -1))

  const current = stack[stack.length - 1]

  return (
    <div>
      <p>{screens[current].text}</p>
      <button onClick={() => go('Details')}>Вперед</button> <button onClick={goBack}>Назад</button>
    </div>
  )
}
