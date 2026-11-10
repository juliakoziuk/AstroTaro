import { useState } from 'react'
import { PageHead, Chip } from '../ui.jsx'
import { SIGNS, glyphOf, compatibility } from '../astro.js'
import { go } from '../useHashRoute.js'
import { useAuth } from '../authCore.js'

// Mystic Market, Profile & Settings, Notifications, Admin Panel.
// Дані макетні: бекенду, оплати й ролей поки немає.

/* ---------------- Mystic Market ---------------- */
const PRODUCTS = [
  { id: 'p1', glyph: '♧', kind: 'Колоди', room: 'tarot', title: 'The Moonlit Deck', note: '78 карт, золоте тиснення', price: 29 },
  { id: 'p2', glyph: '☾', kind: 'Колоди', room: 'dreams', title: 'Dream Oracle', note: '44 карти образів снів', price: 24 },
  { id: 'p3', glyph: '☼', kind: 'Курси', room: 'astrology', title: 'Астрологія для початківців', note: '6 уроків, 3 години', price: 39 },
  { id: 'p4', glyph: '✎', kind: 'Курси', room: 'journal', title: 'Щоденник як практика', note: 'Тижневий інтенсив', price: 19 },
  { id: 'p5', glyph: '☄', kind: 'Послуги', room: 'dreams', title: 'Розбір снів із ментором', note: '45 хвилин, відео', price: 49 },
  { id: 'p6', glyph: '◇', kind: 'Послуги', room: 'history', title: 'Річний звіт про шлях', note: 'PDF з вашої історії', price: 15 },
]

export function Market() {
  const [kind, setKind] = useState('Усе')
  const [cart, setCart] = useState([])
  const kinds = ['Усе', 'Колоди', 'Курси', 'Послуги']
  const shown = PRODUCTS.filter((p) => kind === 'Усе' || p.kind === kind)
  const total = cart.reduce((s, id) => s + PRODUCTS.find((p) => p.id === id).price, 0)

  return (
    <>
      <PageHead title="Mystic Market">Колоди, курси та послуги для практики самопізнання. Оплата в цій версії макетна.</PageHead>
      <div className="mq-market-bar">
        <div className="mq-chips">
          {kinds.map((k) => (
            <Chip key={k} active={k === kind} onClick={() => setKind(k)}>{k}</Chip>
          ))}
        </div>
        <span className="mq-cart">Кошик: {cart.length} · ${total}</span>
      </div>
      <div className="mq-market">
        {shown.map((p) => {
          const inCart = cart.includes(p.id)
          return (
            <article key={p.id} className="mq-product" data-room={p.room}>
              <div className="mq-product-art" aria-hidden="true">{p.glyph}</div>
              <div className="mq-product-body">
                <span className="mq-eyebrow">{p.kind}</span>
                <h3>{p.title}</h3>
                <p className="muted small">{p.note}</p>
                <div className="mq-product-foot">
                  <strong>${p.price}</strong>
                  <button
                    className={`mq-btn ${inCart ? '' : 'mq-btn--lit'}`}
                    onClick={() => setCart((c) => (inCart ? c.filter((x) => x !== p.id) : [...c, p.id]))}
                  >
                    {inCart ? 'У кошику' : 'Купити'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

/* ---------------- Profile & Settings ---------------- */
function Toggle({ label, hint, on, onChange }) {
  return (
    <label className="mq-toggle">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  )
}

export function Profile() {
  const { user } = useAuth()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState({ daily: true, moon: true, tips: false })
  const set = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }))

  return (
    <>
      <PageHead title="Профіль і налаштування">Твої дані, сповіщення та приватність.</PageHead>
      <div className="mq-profile">
        <section className="mq-plaque" aria-label="Профіль">
          <div className="mq-profile-top">
            <span className="mq-avatar mq-avatar--xl" aria-hidden="true">{name.slice(0, 1).toUpperCase() || '?'}</span>
            <div>
              <h2>{name || 'Без імені'}</h2>
              <p className="muted small">{email} · план Plus</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSaved(true)
              setTimeout(() => setSaved(false), 2200)
            }}
          >
            <div className="mq-field">
              <label htmlFor="pn">Ім’я</label>
              <input id="pn" className="mq-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mq-field">
              <label htmlFor="pe">Email</label>
              <input id="pe" type="email" className="mq-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mq-row">
              <button className="mq-btn mq-btn--lit" type="submit">Зберегти</button>
              {saved && <span className="muted small" role="status">Збережено</span>}
            </div>
          </form>
        </section>

        <section className="mq-plaque" aria-label="Сповіщення та приватність">
          <h2>Сповіщення</h2>
          <Toggle label="Карта дня щоранку" on={prefs.daily} onChange={set('daily')} />
          <Toggle label="Фази Місяця" hint="Нагадування про новий і повний місяць" on={prefs.moon} onChange={set('moon')} />
          <Toggle label="Поради та новини" on={prefs.tips} onChange={set('tips')} />
          <h2 style={{ marginTop: 22 }}>Приватність</h2>
          <div className="mq-row" style={{ marginTop: 18 }}>
            <button className="mq-btn" onClick={() => go('pricing')}>Змінити план</button>
            <button className="mq-btn" onClick={() => go('landing')}>Вийти</button>
          </div>
        </section>
      </div>
    </>
  )
}

/* ---------------- Notifications ---------------- */
const NOTES = [
  { id: 'n1', kind: 'Місяць', title: 'Новий місяць за 9 днів', text: 'Час намірів: запиши, що хочеш почати.', when: 'Сьогодні', unread: true },
  { id: 'n2', kind: 'Сни', title: 'Образ «вода» повторюється', text: 'Це вже втретє за місяць. Відкрий аналіз сну.', when: 'Вчора', unread: true, to: 'analysis' },
  { id: 'n3', kind: 'Таро', title: 'Твій розклад готовий', text: 'Тлумачення «Три карти» збережено в історії.', when: '2 дні тому', unread: false, to: 'reading' },
  { id: 'n4', kind: 'Щоденник', title: 'Серія 6 днів', text: 'Ти записуєш думки шостий день поспіль.', when: '3 дні тому', unread: false, to: 'journal' },
  { id: 'n5', kind: 'Система', title: 'Оновлення профілю', text: 'Налаштування приватності збережені.', when: 'Тиждень тому', unread: false },
]

export function Notifications() {
  const [items, setItems] = useState(NOTES)
  const [filter, setFilter] = useState('Усі')
  const unread = items.filter((n) => n.unread).length
  const kinds = ['Усі', ...new Set(NOTES.map((n) => n.kind))]
  const shown = items.filter((n) => filter === 'Усі' || n.kind === filter)

  return (
    <>
      <PageHead title="Сповіщення">{unread ? `Нових: ${unread}` : 'Усе прочитано'}</PageHead>
      <div className="mq-market-bar">
        <div className="mq-chips">
          {kinds.map((k) => (
            <Chip key={k} active={k === filter} onClick={() => setFilter(k)}>{k}</Chip>
          ))}
        </div>
        <button className="mq-btn mq-btn--text mq-btn" onClick={() => setItems((l) => l.map((n) => ({ ...n, unread: false })))}>
          Позначити всі прочитаними
        </button>
      </div>
      <ul className="mq-notes">
        {shown.map((n) => (
          <li key={n.id} className={n.unread ? 'is-unread' : ''}>
            <span className="mq-note-dot" aria-hidden="true" />
            <div>
              <strong>{n.title}</strong>
              <p className="muted">{n.text}</p>
              <span className="muted small">{n.kind} · {n.when}</span>
            </div>
            <div className="mq-row">
              {n.to && <button className="mq-btn" onClick={() => go(n.to)}>Відкрити</button>}
              {n.unread && (
                <button className="mq-btn mq-btn--text mq-btn" onClick={() => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}>
                  Прочитано
                </button>
              )}
            </div>
          </li>
        ))}
        {!shown.length && <li className="muted">Тут поки порожньо.</li>}
      </ul>
    </>
  )
}

/* ---------------- Admin Panel ---------------- */
const STATS = [
  { label: 'Користувачі', value: '12 436', delta: '+8,2 %' },
  { label: 'Дохід, міс', value: '$24 380', delta: '+12 %' },
  { label: 'Розклади', value: '856', delta: '+3,4 %' },
  { label: 'AI-розмови', value: '45 722', delta: '+15 %' },
]
const WEEK = [38, 52, 44, 68, 59, 81, 74]
const USERS = [
  { name: 'Олена К.', plan: 'Plus', date: 'сьогодні' },
  { name: 'Марко Д.', plan: 'Free', date: 'сьогодні' },
  { name: 'Софія Л.', plan: 'Premium', date: 'вчора' },
  { name: 'Ілля Р.', plan: 'Free', date: 'вчора' },
]
const CONTENT = [
  { title: 'Колода The Moonlit', state: 'Опубліковано' },
  { title: 'Курс «Астрологія для початківців»', state: 'Чернетка' },
  { title: 'Стаття про сни й памʼять', state: 'На перевірці' },
]

export function Admin() {
  const max = Math.max(...WEEK)
  return (
    <>
      <PageHead title="Адмін-панель">Огляд платформи. Дані в цій версії макетні.</PageHead>
      <div className="mq-stats">
        {STATS.map((s) => (
          <section key={s.label} className="mq-plaque">
            <p className="muted small">{s.label}</p>
            <strong className="mq-stat-big">{s.value}</strong>
            <span className="mq-delta">{s.delta}</span>
          </section>
        ))}
      </div>
      <div className="mq-admin">
        <section className="mq-plaque" aria-label="Реєстрації за тиждень">
          <h2>Реєстрації за 7 днів</h2>
          <div className="mq-bars" role="img" aria-label="Стовпчаста діаграма реєстрацій">
            {WEEK.map((v, i) => (
              <div key={i} className="mq-bar" style={{ height: `${(v / max) * 100}%` }}>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="mq-bars-axis muted small">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </section>
        <section className="mq-plaque" aria-label="Нові користувачі">
          <h2>Нові користувачі</h2>
          <table className="mq-table-plain">
            <tbody>
              {USERS.map((u) => (
                <tr key={u.name}>
                  <td>{u.name}</td>
                  <td className="muted">{u.plan}</td>
                  <td className="muted">{u.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="mq-plaque mq-admin-wide" aria-label="Контент">
          <h2>Контент</h2>
          <ul className="mq-meanings">
            {CONTENT.map((c) => (
              <li key={c.title}>
                <strong>{c.title}</strong>
                <span className="muted">{c.state}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

/* ---------------- Compatibility ---------------- */
export function Compatibility() {
  const [a, setA] = useState(0)
  const [b, setB] = useState(4)
  const match = compatibility(a, b)
  return (
    <>
      <PageHead title="Космічна сумісність">Порівняй два знаки як привід для розмови, а не вирок стосункам.</PageHead>
      <div className="mq-profile">
        {[[a, setA, 'Твій знак'], [b, setB, 'Знак іншої людини']].map(([val, set, label]) => (
          <section className="mq-plaque" key={label}>
            <h2>{label}</h2>
            <div className="mq-field">
              <label htmlFor={label}>Знак зодіаку</label>
              <select id={label} className="mq-select" value={val} onChange={(e) => set(Number(e.target.value))}>
                {SIGNS.map((s, i) => (
                  <option key={s.name} value={i}>{glyphOf(s)} {s.name}</option>
                ))}
              </select>
            </div>
          </section>
        ))}
      </div>
      <section className="mq-plaque mq-compat" aria-label="Результат">
        <div className="mq-compat-glyphs" aria-hidden="true">{glyphOf(SIGNS[a])} &nbsp; ♡ &nbsp; {glyphOf(SIGNS[b])}</div>
        <strong className="mq-stat-big">{match.score}%</strong>
        <p className="muted">{match.text}</p>
      </section>
    </>
  )
}

/* ---------------- My Library ---------------- */
const OWNED = [
  { id: 'l1', glyph: '♧', title: 'The Moonlit Path', note: 'Колода таро' },
  { id: 'l2', glyph: '❀', title: 'Midnight Garden', note: 'Тема оформлення' },
  { id: 'l3', glyph: '☼', title: 'Cosmic Atlas', note: 'Астрологічний гід' },
]

export function Library() {
  const [active, setActive] = useState('l2')
  return (
    <>
      <PageHead title="Моя бібліотека">Твої колоди, теми та збережені матеріали.</PageHead>
      <div className="mq-market">
        {OWNED.map((o) => (
          <article key={o.id} className="mq-product">
            <div className="mq-product-art" aria-hidden="true">{o.glyph}</div>
            <div className="mq-product-body">
              <span className="mq-eyebrow">{o.id === active ? 'Активно' : 'У бібліотеці'}</span>
              <h3>{o.title}</h3>
              <p className="muted small">{o.note}</p>
              <div className="mq-product-foot">
                <span />
                <button className={`mq-btn ${o.id === active ? '' : 'mq-btn--lit'}`} onClick={() => setActive(o.id)}>
                  {o.id === active ? 'Використовується' : 'Використати'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
