// Сторінка «Команда»: маленькі компоненти складаються в більші.

function Avatar({ name, size = 40 }) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')

  return (
    <span
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#6d4aff',
        color: '#fff',
        fontWeight: 600,
        fontSize: size / 2.5,
      }}
    >
      {initials}
    </span>
  )
}

// role має значення за замовчуванням, online — булевий проп
function UserBadge({ name, role = 'Учасник', online = false }) {
  return (
    <div className="row">
      <Avatar name={name} />
      <div>
        <strong>{name}</strong> {online && <span className="pill">онлайн</span>}
        <div className="muted">{role}</div>
      </div>
    </div>
  )
}

// children — усе, що вкладено між <Card> і </Card>; footer — JSX, переданий як звичайний проп
function Card({ title, footer, children }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      {children}
      {footer && <div style={{ marginTop: 10 }}>{footer}</div>}
    </div>
  )
}

export default function TeamExample() {
  return (
    <Card title="Команда проекту" footer={<small className="muted">Усього людей: 3</small>}>
      <UserBadge name="Олена Коваль" role="Тімлід" online />
      <UserBadge name="Максим Бойко" />
      <UserBadge name="Ірина Шевчук" role="Дизайнер" online />
    </Card>
  )
}
