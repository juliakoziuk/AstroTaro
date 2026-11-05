function Card({ title }) {
  return (
    <div className="card">
      <h4>{title}</h4>
    </div>
  )
}

export default function MissingChildren() {
  return (
    <Card title="Новини">
      <p>Сьогодні вихідний!</p>
    </Card>
  )
}
