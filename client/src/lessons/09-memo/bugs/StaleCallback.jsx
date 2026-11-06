import { useCallback, useState } from 'react'

export default function StaleCallback() {
  const [count, setCount] = useState(0)
  const [shown, setShown] = useState('—')

  const showCount = useCallback(() => {
    setShown('Зараз count = ' + count)
  }, [])

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1 ({count})</button>{' '}
      <button onClick={showCount}>Показати count</button>
      <p>{shown}</p>
    </div>
  )
}
