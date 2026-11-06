const base = { color: 'gray', padding: 8, borderRadius: 6, background: '#f1efff' }

function Message({ style, children }) {
  return <p style={{ ...style, ...base }}>{children}</p>
}

export default function SpreadOrder() {
  return (
    <div>
      <Message>Звичайне повідомлення</Message>
      <Message style={{ color: 'crimson', fontWeight: 700 }}>Я маю бути червоним і жирним!</Message>
    </div>
  )
}
