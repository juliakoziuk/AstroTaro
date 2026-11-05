import { useState } from 'react'

// Різні способи оновити state: «знімок» значення проти функціонального оновлення
export default function StateBasics() {
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)
  const [user, setUser] = useState({ name: 'Оля', age: 20 })

  return (
    <div>
      <div className="row">
        <button onClick={() => { setA(a + 1); setA(a + 1); setA(a + 1) }}>
          setA(a + 1) ×3
        </button>
        <strong>a = {a}</strong>
        <span className="muted">← додає лише 1: усі три виклики бачать однакове «знімок» a</span>
      </div>

      <div className="row">
        <button onClick={() => { setB((prev) => prev + 1); setB((prev) => prev + 1); setB((prev) => prev + 1) }}>
          setB(prev =&gt; prev + 1) ×3
        </button>
        <strong>b = {b}</strong>
        <span className="muted">← додає 3: кожне оновлення бере результат попереднього</span>
      </div>

      <div className="row">
        {/* об’єкт у state: копіюємо через spread і міняємо одне поле */}
        <button onClick={() => setUser({ ...user, age: user.age + 1 })}>З днем народження</button>
        <span>
          {user.name}, {user.age} років
        </span>
      </div>

      <div className="row">
        <button onClick={() => { setA(0); setB(0); setUser({ name: 'Оля', age: 20 }) }}>Скинути</button>
      </div>
    </div>
  )
}
