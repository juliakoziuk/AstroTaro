function Item(props) {
  return (
    <li>
      id = {String(props.key)}, назва = {props.label}
    </li>
  )
}

export default function KeyAsProp() {
  return (
    <ul>
      <Item key="a1" label="Перший" />
    </ul>
  )
}
