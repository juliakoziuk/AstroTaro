import { useState } from 'react'
import { getUser, getPosts } from '../../fakeApi.js'

export default function SequentialAwaits() {
  const [ms, setMs] = useState(null)

  async function sequential() {
    const start = Date.now()
    await getUser(2) // 0,3 с
    await getPosts(2) // 0,5 с — чекає, поки завершиться попередній
    setMs(Date.now() - start)
  }

  async function parallel() {
    const start = Date.now()
    await Promise.all([getUser(2), getPosts(2)])
    setMs(Date.now() - start)
  }

  return (
    <div className="row">
      <button onClick={sequential}>Послідовно</button>
      <button onClick={parallel}>Паралельно (Promise.all)</button>
      <strong>{ms === null ? '—' : ms + ' мс'}</strong>
    </div>
  )
}
