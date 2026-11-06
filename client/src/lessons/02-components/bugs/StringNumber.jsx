function Price({ value }) {
  return <p>Ціна з доставкою: {value + 50} ₴</p>
}

export default function StringNumber() {
  return <Price value="100" />
}
