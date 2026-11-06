import { useState } from 'react'

export default function MutateStack() {
  const [stack, setStack] = useState(['Home'])

  function go(name) {
    stack.push(name)
    setStack(stack)
  }

  return (
    <div>
      <p>Поточний екран: <strong>{stack[stack.length - 1]}</strong></p>
      <button onClick={() => go('Details')}>Перейти на Details</button>
      <p className="muted">Стек: {stack.join(' › ')}</p>
    </div>
  )
}
