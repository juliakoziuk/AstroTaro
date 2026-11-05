import { useState } from 'react'
import { fakeFetch } from '../fakeApi.js'

// fetch НЕ кидає помилку на 404/500: це «нормальна» відповідь. Перевіряй res.ok сам.
async function loadJson(url, options) {
  const res = await fakeFetch(url, options)
  if (!res.ok) throw new Error(`Сервер відповів ${res.status}`)
  return res.json()
}

export default function ResponseCheck() {
  const [result, setResult] = useState('Натисни одну з кнопок')

  async function run(url, options) {
    setResult('⏳ …')
    try {
      const data = await loadJson(url, options)
      setResult('✅ ' + JSON.stringify(data))
    } catch (error) {
      setResult('❌ ' + error.message)
    }
  }

  return (
    <div>
      <div className="row">
        <button onClick={() => run('/users/1', { delay: 300 })}>Існуючий користувач</button>
        <button onClick={() => run('/users/99', { delay: 300 })}>Користувач 99 (404)</button>
        <button onClick={() => run('/users/1', { delay: 300, fail: true })}>Немає мережі</button>
      </div>
      <p>{result}</p>
    </div>
  )
}
