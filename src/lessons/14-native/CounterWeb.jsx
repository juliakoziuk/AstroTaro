import { useState } from 'react'

// ВЕБ: звичайні HTML-теги, onClick, стилі — об’єкт або CSS
export default function CounterWeb() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16 }}>
      <p style={{ fontSize: 24, margin: 0 }}>Кліків: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{ background: '#6d4aff', color: '#fff', border: 0, borderRadius: 8, padding: '8px 16px' }}
      >
        Клікни
      </button>
    </div>
  )
}
