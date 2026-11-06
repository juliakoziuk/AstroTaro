import { useState } from 'react'

export default function FormReload() {
  const [sent, setSent] = useState(false)

  function handleSubmit() {
    setSent(true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Твій email" />
      <button type="submit">Підписатися</button>
      {sent && <p>Дякуємо за підписку!</p>}
    </form>
  )
}
