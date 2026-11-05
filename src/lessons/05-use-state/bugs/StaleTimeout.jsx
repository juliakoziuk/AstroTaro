import { useState } from 'react'

export default function StaleTimeout() {
  const [count, setCount] = useState(0)
  const [saved, setSaved] = useState('—')

  function remember() {
    setTimeout(() => setSaved('Лічильник був ' + count), 2000)
  }

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1 ({count})</button>{' '}
      <button onClick={remember}>Запам’ятати через 2 секунди</button>
      <p>{saved}</p>
    </div>
  )
}
