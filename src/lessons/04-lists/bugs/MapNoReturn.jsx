export default function MapNoReturn() {
  const names = ['Оля', 'Максим', 'Ірина']

  return (
    <ul>
      {names.map((name) => {
        <li key={name}>{name}</li>
      })}
    </ul>
  )
}
