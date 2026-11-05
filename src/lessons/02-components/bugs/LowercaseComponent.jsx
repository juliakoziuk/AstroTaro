function badge({ text }) {
  return <span className="pill">{text}</span>
}

export default function LowercaseComponent() {
  return (
    <p>
      Статус: <badge text="Новий" />
    </p>
  )
}
