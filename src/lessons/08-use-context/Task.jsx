import { createContext, useContext, useState } from 'react'

// ЗАВДАННЯ: кошик через Context.
// Пиши прямо в цьому файлі, результат одразу видно на сторінці уроку.
//
// TODO 1. CartProvider: у state масив items [{ id, name, price }]. Через контекст віддай
//         items, addItem(product), removeItem(id), clear().
// TODO 2. Власний хук useCart(): повертає значення контексту; якщо його викликали поза
//         CartProvider — кидає зрозумілу помилку.
// TODO 3. ProductList: три товари з кнопкою «Додати». Не отримує жодних props про кошик.
// TODO 4. CartBadge: «🛒 N» — кількість у кошику. Є в «шапці», далеко від ProductList.
// TODO 5. CartPanel: список товарів у кошику, кнопка ✕ біля кожного, «Разом: N ₴», «Очистити».
//         Якщо кошик порожній — «Кошик порожній».
// БОНУС. Один товар можна додати лише раз: якщо він уже є, кнопка «Додати» вимкнена («У кошику»).

const PRODUCTS = [
  { id: 1, name: 'Навушники', price: 1890 },
  { id: 2, name: 'Чохол', price: 350 },
  { id: 3, name: 'Павербанк', price: 1200 },
]

const CartContext = createContext(null)

function CartProvider({ children }) {
  const [items] = useState([])
  return <CartContext value={{ items }}>{children}</CartContext>
}

function CartBadge() {
  const { items } = useContext(CartContext)
  return <strong>🛒 {items.length} (дороби мене)</strong>
}

export default function ContextTask() {
  return (
    <CartProvider>
      <CartBadge />
      <ul>
        {PRODUCTS.map((p) => (
          <li key={p.id}>
            {p.name} — {p.price} ₴
          </li>
        ))}
      </ul>
    </CartProvider>
  )
}
