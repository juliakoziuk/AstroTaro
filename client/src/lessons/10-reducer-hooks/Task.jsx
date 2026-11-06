import { useEffect, useReducer, useState } from 'react'

// ЗАВДАННЯ: кошик на useReducer + власні хуки.
// Пиши прямо в цьому файлі, результат одразу видно на сторінці уроку.
//
// TODO 1. cartReducer(state, action) для дій:
//         'added' ({ product })  — додати товар або збільшити qty, якщо він уже є;
//         'incremented' ({ id }) / 'decremented' ({ id }) — qty ±1 (при 0 — товар видалити);
//         'removed' ({ id });  'cleared'.
//         default: кинути помилку «Невідома дія». Ніяких мутацій!
// TODO 2. Компонент Cart: useReducer(cartReducer, []), кнопки «Додати» біля товарів,
//         список з + / − / ✕ та «Разом: N ₴». Усе — через dispatch.
// TODO 3. Власний хук useLocalStorage(key, initial): кошик зберігається між перезавантаженнями.
//         (Підказка: useReducer не підходить для ледачого читання; можеш передати третім
//         аргументом init-функцію: useReducer(reducer, null, () => readFromStorage()).)
// TODO 4. Власний хук useToggle: кнопка «Показати/сховати кошик».
// БОНУС. Власний хук useDocumentTitle(title) — у вкладці показується «Кошик (N)».

const PRODUCTS = [
  { id: 1, name: 'Навушники', price: 1890 },
  { id: 2, name: 'Чохол', price: 350 },
  { id: 3, name: 'Павербанк', price: 1200 },
]

function cartReducer(state, action) {
  switch (action.type) {
    case 'cleared':
      return []
    default:
      throw new Error('Невідома дія: ' + action.type)
  }
}

export default function CartTask() {
  const [cart, dispatch] = useReducer(cartReducer, [])
  const [open] = useState(true)
  useEffect(() => {}, [])

  return (
    <div>
      <ul>
        {PRODUCTS.map((p) => (
          <li key={p.id}>
            {p.name} — {p.price} ₴
          </li>
        ))}
      </ul>
      <p>У кошику: {cart.length}</p>
      {open && <button onClick={() => dispatch({ type: 'cleared' })}>Очистити (дороби решту)</button>}
    </div>
  )
}
