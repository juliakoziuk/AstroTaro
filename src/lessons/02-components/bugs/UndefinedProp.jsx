function Greeting({ name }) {
  return <p>Привіт, {name.toUpperCase()}!</p>
}

export default function UndefinedProp() {
  return (
    <>
      <Greeting name="Оля" />
      <Greeting />
    </>
  )
}
