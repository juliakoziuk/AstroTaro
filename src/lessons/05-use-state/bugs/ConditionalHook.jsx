import { useState } from 'react'

export default function ConditionalHook() {
  const [open, setOpen] = useState(false)

  let note = ''
  if (open) {
    const [text] = useState('Моя нотатка')
    note = text
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)}>{open ? 'Сховати' : 'Показати'} нотатку</button>
      <p>{note}</p>
    </div>
  )
}
