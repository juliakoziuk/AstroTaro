import { useMemo, useState } from 'react'

export default function MutatedDep() {
  const [items, setItems] = useState([{ name: 'Книга', price: 200 }])
  const [, forceRender] = useState(0)

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items])

  function add() {
    items.push({ name: 'Ще книга', price: 100 })
    forceRender((n) => n + 1)
  }

  return (
    <div>
      <button onClick={add}>Додати товар за 100</button>
      <p>Товарів у списку: {items.length}</p>
      <p>Разом: {total} ₴</p>
    </div>
  )
}
