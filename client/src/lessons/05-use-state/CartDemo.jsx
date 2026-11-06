import { useState } from 'react'

const initialCart = [
  { id: 1, name: 'Навушники Aura', price: 1890, qty: 1 },
  { id: 2, name: 'Чохол для телефону', price: 350, qty: 2 },
  { id: 3, name: 'Павербанк 20000', price: 1200, qty: 1 },
]

// Кошик: state — лише список з кількостями. Усе інше (сума, кількість) обчислюємо.
export default function CartDemo() {
  const [cart, setCart] = useState(initialCart)

  function changeQty(id, delta) {
    setCart(
      cart
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0), // кількість 0 → товар зникає
    )
  }

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  if (cart.length === 0) {
    return (
      <p>
        Кошик порожній. <button onClick={() => setCart(initialCart)}>Повернути товари</button>
      </p>
    )
  }

  return (
    <div>
      <ul className="list-plain">
        {cart.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <span className="muted">{item.price} ₴</span>
            <span style={{ marginLeft: 'auto' }}>
              <button onClick={() => changeQty(item.id, -1)}>−</button> <strong>{item.qty}</strong>{' '}
              <button onClick={() => changeQty(item.id, +1)}>+</button>
            </span>
          </li>
        ))}
      </ul>
      <p>
        Товарів: <strong>{totalCount}</strong>, разом: <strong>{totalPrice} ₴</strong>
      </p>
    </div>
  )
}
