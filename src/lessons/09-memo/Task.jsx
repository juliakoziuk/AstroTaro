import { useState } from 'react'
import { RenderBadge } from '../ui.jsx'

// ЗАВДАННЯ: прибрати зайві перемальовування.
// Пиши прямо в цьому файлі. Критерій успіху — бейджі «оновлень»: вони мають рости лише тоді, коли
// змінилися дані саме цього компонента.
//
// Зараз: будь-який клік (лічильник чи введення тексту) перемальовує ВСЕ.
//
// TODO 1. Header не залежить ні від чого → обгорни в memo(). Бейдж не росте, коли клікаєш лічильник.
// TODO 2. Counter отримує onReset: стабільний обробник (useCallback) + memo(Counter).
//         Бейдж Counter не росте, коли друкуєш у полі.
// TODO 3. Статистика (StatsPanel) отримує масив sortedNames. Обчисли його через useMemo від names,
//         обгорни StatsPanel в memo(): друкування в полі її більше не чіпає.
// TODO 4. Додай кнопку «Додати ім’я» (пушить у names НОВИМ масивом) і переконайся, що
//         StatsPanel тоді оновлюється — а при друкуванні в полі ні.
// БОНУС. Прибери memo/useCallback/useMemo з одного компонента й поясни собі, чому бейдж почав рости.

function Header() {
  return (
    <div className="card">
      <strong>Шапка</strong> <RenderBadge label="оновлень" />
    </div>
  )
}

function Counter({ onReset, value }) {
  return (
    <div className="card">
      Лічильник: {value} <button onClick={onReset}>Скинути</button> <RenderBadge label="оновлень" />
    </div>
  )
}

function StatsPanel({ sortedNames }) {
  return (
    <div className="card">
      Імена: {sortedNames.join(', ')} <RenderBadge label="оновлень" />
    </div>
  )
}

export default function MemoTask() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [names] = useState(['Оля', 'Андрій', 'Іра'])

  const sortedNames = [...names].sort()

  return (
    <div>
      <Header />
      <div className="row">
        <button onClick={() => setCount(count + 1)}>+1</button>
        <input type="text" placeholder="Друкуй…" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <Counter value={count} onReset={() => setCount(0)} />
      <StatsPanel sortedNames={sortedNames} />
    </div>
  )
}
