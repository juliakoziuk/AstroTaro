function Counter(props) {
  props.value = props.value + 1
  return <p>Значення: {props.value}</p>
}

export default function MutateProps() {
  return <Counter value={5} />
}
