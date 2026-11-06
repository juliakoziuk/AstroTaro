import { StackNavigator, TabNavigator } from './MiniNav.jsx'
import { useNavigation, useRoute } from './navCore.js'
import { PhoneFrame } from '../ui.jsx'

const PRODUCTS = [
  { id: 1, name: 'Навушники Aura', price: 1890 },
  { id: 2, name: 'Чохол для телефону', price: 350 },
  { id: 3, name: 'Павербанк 20000', price: 1200 },
]

// Екран 1: список. По тапу переходимо на «Details» і передаємо ПАРАМЕТР (id).
function CatalogScreen() {
  const navigation = useNavigation()
  return (
    <div>
      {PRODUCTS.map((p) => (
        <div
          key={p.id}
          onClick={() => navigation.navigate('Details', { id: p.id })}
          style={{ padding: '10px 4px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex' }}
        >
          <span>{p.name}</span>
          <span style={{ marginLeft: 'auto', color: '#6d4aff' }}>›</span>
        </div>
      ))}
    </div>
  )
}

// Екран 2: деталі. Читає параметри з route.params.
function DetailsScreen() {
  const navigation = useNavigation()
  const { params } = useRoute()
  const product = PRODUCTS.find((p) => p.id === params.id)
  const next = PRODUCTS.find((p) => p.id === (params.id % PRODUCTS.length) + 1)

  return (
    <div>
      <h3 style={{ margin: '0 0 6px' }}>{product.name}</h3>
      <p style={{ margin: '0 0 12px' }}>Ціна: {product.price} ₴</p>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#777' }}>route.params = {JSON.stringify(params)}</p>
      <button onClick={() => navigation.navigate('Details', { id: next.id })} style={{ marginRight: 8 }}>
        Далі: {next.name}
      </button>
      <button onClick={navigation.popToTop}>До каталогу</button>
    </div>
  )
}

function CatalogStack() {
  return (
    <StackNavigator
      initialRoute="Catalog"
      screens={{
        Catalog: { component: CatalogScreen, title: 'Каталог' },
        Details: { component: DetailsScreen, title: (params) => 'Товар №' + params.id },
      }}
    />
  )
}

function ProfileScreenBody() {
  return (
    <div style={{ padding: 12, color: '#222', background: '#fff', height: '100%' }}>
      <h3>Профіль</h3>
      <p>Це друга вкладка. Перемикайся між вкладками: стек «Каталогу» збережеться.</p>
    </div>
  )
}

export default function ShopApp() {
  return (
    <PhoneFrame height={470}>
      <TabNavigator
        tabs={[
          { name: 'CatalogTab', label: 'Каталог', icon: '🛍️', component: CatalogStack },
          { name: 'ProfileTab', label: 'Профіль', icon: '👤', component: ProfileScreenBody },
        ]}
      />
    </PhoneFrame>
  )
}
