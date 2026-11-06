import { useEffect, useRef, useState } from 'react'

// Міні-чат: ref на DOM-елементи (поле вводу й список) для фокуса та автоскролу
export default function ChatBox() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Привіт! Напиши щось.' },
    { id: 2, text: 'Enter відправляє повідомлення.' },
  ])
  const [text, setText] = useState('')
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // після кожного нового повідомлення прокручуємо список донизу
  useEffect(() => {
    const list = listRef.current
    list.scrollTop = list.scrollHeight
  }, [messages])

  function send(e) {
    e.preventDefault()
    if (!text.trim()) return
    setMessages([...messages, { id: Date.now(), text: text.trim() }])
    setText('')
    inputRef.current.focus() // повертаємо фокус у поле
  }

  return (
    <div>
      <div
        ref={listRef}
        style={{ height: 120, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}
      >
        {messages.map((m) => (
          <div key={m.id}>💬 {m.text}</div>
        ))}
      </div>
      <form onSubmit={send} className="row">
        <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Повідомлення…" />
        <button type="submit">Надіслати</button>
        <button type="button" onClick={() => inputRef.current.focus()}>
          Фокус у поле
        </button>
      </form>
    </div>
  )
}
