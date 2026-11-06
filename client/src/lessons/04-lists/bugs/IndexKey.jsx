import { useState } from 'react'

export default function IndexKey() {
  const [items, setItems] = useState(['Яблука', 'Банани', 'Вишні'])

  return (
    <div>
      <button onClick={() => setItems(['Нове', ...items])}>Додати зверху</button>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item}: <input type="text" />
          </li>
        ))}
      </ul>
    </div>
  )
}
