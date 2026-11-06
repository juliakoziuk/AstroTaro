import { useState } from 'react'

export default function MutateSort() {
  const [numbers, setNumbers] = useState([30, 5, 12, 1])

  function sort() {
    numbers.sort((a, b) => a - b)
    setNumbers(numbers)
  }

  return (
    <div>
      <button onClick={sort}>Сортувати</button>
      <p>{numbers.join(', ')}</p>
    </div>
  )
}
