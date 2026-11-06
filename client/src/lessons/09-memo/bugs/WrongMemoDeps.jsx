import { useMemo, useState } from 'react'

const FRUITS = ['Яблуко', 'Банан', 'Вишня', 'Ананас', 'Абрикос']

export default function WrongMemoDeps() {
  const [query, setQuery] = useState('')

  const visible = useMemo(
    () => FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase())),
    [],
  )

  return (
    <div>
      <input type="text" placeholder="Пошук (спробуй «ан»)" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>{visible.join(', ')}</p>
    </div>
  )
}
