export default function ZeroAnd() {
  const cart = { items: [] }

  return (
    <div>
      <h3>Кошик</h3>
      {cart.items.length && <p>Товарів у кошику: {cart.items.length}</p>}
    </div>
  )
}
