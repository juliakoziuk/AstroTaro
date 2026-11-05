// Три типові розкладки на flexbox. Лише style-об’єкти, жодного CSS-файлу —
// так само пишуться стилі в React Native (там display: 'flex' уже за замовчуванням).

const screen = {
  width: 260,
  height: 300,
  border: '2px solid #888',
  borderRadius: 14,
  overflow: 'hidden',
  background: '#fff',
  color: '#222',
  fontSize: 14,
  display: 'flex',
  flexDirection: 'column',
}

// 1. Центрування по обох осях
function Centered() {
  return (
    <div style={{ ...screen, height: 150, justifyContent: 'center', alignItems: 'center' }}>
      <strong style={{ fontSize: 18 }}>Я в центрі</strong>
    </div>
  )
}

// 2. Екран: шапка зверху, контент займає весь залишок (flex: 1), підвал внизу
function AppScreen() {
  return (
    <div style={screen}>
      <div style={{ background: '#6d4aff', color: '#fff', padding: 12, fontWeight: 700 }}>Шапка</div>
      <div style={{ flex: 1, padding: 12, background: '#f4f1ff' }}>Контент розтягується на все, що лишилось</div>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: 10, borderTop: '1px solid #ddd' }}>
        <span>🏠</span>
        <span>🔎</span>
        <span>👤</span>
      </div>
    </div>
  )
}

// 3. Рядок списку: аватар зліва, текст по центру (займає вільне місце), кнопка справа
function ListRow() {
  return (
    <div style={{ ...screen, height: 'auto' }}>
      {['Олена Коваль', 'Максим Бойко'].map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            borderBottom: '1px solid #eee',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: '#6d4aff',
              color: '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 700,
            }}
          >
            {name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div style={{ color: '#888', fontSize: 12 }}>онлайн</div>
          </div>
          <span style={{ color: '#6d4aff' }}>›</span>
        </div>
      ))}
    </div>
  )
}

export default function Layouts() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      <Centered />
      <AppScreen />
      <ListRow />
    </div>
  )
}
