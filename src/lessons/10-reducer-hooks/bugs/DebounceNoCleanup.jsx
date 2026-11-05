import { useEffect, useState } from 'react'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    setTimeout(() => setDebounced(value), delay)
  }, [value, delay])

  return debounced
}

export default function DebounceNoCleanup() {
  const [query, setQuery] = useState('')
  const [requests, setRequests] = useState(0)
  const debounced = useDebounce(query, 600)

  // «запит» летить при кожній зміні debounced
  useEffect(() => {
    if (debounced) setRequests((n) => n + 1)
  }, [debounced])

  return (
    <div>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Надрукуй слово швидко" />
      <p>
        Debounced: «{debounced}», «запитів» відправлено: {requests}
      </p>
    </div>
  )
}
