export default function ObjectsAsChild() {
  const users = [
    { id: 1, name: 'Оля' },
    { id: 2, name: 'Максим' },
  ]

  return (
    <div>
      <h3>Користувачі</h3>
      {users}
    </div>
  )
}
