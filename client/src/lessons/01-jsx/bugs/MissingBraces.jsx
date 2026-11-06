export default function MissingBraces() {
  const user = { name: 'Оля', avatar: '/favicon.svg' }

  return (
    <div>
      <img src="{user.avatar}" alt="avatar" width="40" />
      <p>Привіт, user.name!</p>
    </div>
  )
}
