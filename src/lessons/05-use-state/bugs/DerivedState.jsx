import { useState } from 'react'

export default function DerivedState() {
  const [first, setFirst] = useState('Олена')
  const [last, setLast] = useState('Коваль')
  const [fullName, setFullName] = useState(first + ' ' + last)

  return (
    <div>
      <input type="text" value={first} onChange={(e) => setFirst(e.target.value)} />{' '}
      <input type="text" value={last} onChange={(e) => setLast(e.target.value)} />
      <p>Повне ім’я: {fullName}</p>
    </div>
  )
}
