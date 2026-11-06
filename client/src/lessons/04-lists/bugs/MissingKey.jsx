export default function MissingKey() {
  const fruits = ['Яблука', 'Банани', 'Вишні']

  return (
    <ul>
      {fruits.map((fruit) => (
        <li>{fruit}</li>
      ))}
    </ul>
  )
}
