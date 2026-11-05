function Hello(name) {
  return <p>Привіт, {name}!</p>
}

export default function NoDestructuring() {
  return <Hello name="Оля" />
}
