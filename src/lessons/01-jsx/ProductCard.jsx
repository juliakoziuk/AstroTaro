// Картка товару з інтернет-магазину.
// `product` — просто дані, що прийшли ззовні (про props — у наступному уроці).
export default function ProductCard({ product }) {
  const hasDiscount = product.oldPrice > product.price
  const discount = Math.round((1 - product.price / product.oldPrice) * 100)

  return (
    // Один кореневий елемент. style — об'єкт: зовнішні {} це «дірка в JS», внутрішні — сам об'єкт.
    <article className="product" style={{ opacity: product.inStock ? 1 : 0.55 }}>
      <img src={product.imageUrl} alt={product.name} />

      <h3>
        {product.name}
        {/* && : бейдж з'являється лише коли є знижка */}
        {hasDiscount && <span className="badge">−{discount}%</span>}
      </h3>

      <p>
        <strong>{product.price} ₴</strong>{' '}
        {hasDiscount && (
          <s style={{ color: 'gray' }}>{product.oldPrice} ₴</s>
        )}
      </p>

      <p>{product.inStock ? 'Є в наявності' : 'Немає в наявності'}</p>

      <p>Теги: {product.tags.join(' · ')}</p>

      {/* htmlFor замість for; defaultValue — початкове значення поля */}
      <label htmlFor={`qty-${product.id}`}>Кількість: </label>
      <input id={`qty-${product.id}`} type="number" min={1} defaultValue={1} />
      <br />

      <button disabled={!product.inStock}>У кошик</button>
    </article>
  )
}
