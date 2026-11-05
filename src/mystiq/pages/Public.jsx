import { useState } from 'react'
import { go } from '../useHashRoute.js'
import { useAuth } from '../authCore.js'

// Публічні сторінки (до входу): головна, вхід, реєстрація, тарифи.
// Авторизація поки макетна: форма просто веде в застосунок.

export function PublicShell({ route, children }) {
  const { user } = useAuth()
  return (
    <div className="mq-public" data-room="history">
      <header className="mq-pub-top">
        <a className="mq-logo" href="#/landing" aria-label="MYSTIQ — головна">
          <span className="mq-logo-mark" aria-hidden="true" />
          Mystiq
        </a>
        <nav className="mq-pub-nav" aria-label="Публічне меню">
          <a href="#/landing" className={route === 'landing' ? 'is-active' : ''}>Функції</a>
          <a href="#/pricing" className={route === 'pricing' ? 'is-active' : ''}>Тарифи</a>
          <a href="#/dashboard">Демо</a>
        </nav>
        <div className="mq-row">
          {user ? (
            <a className="mq-btn mq-btn--lit" href="#/dashboard">Відкрити застосунок</a>
          ) : (
            <>
              <a className="mq-btn" href="#/login">Увійти</a>
              <a className="mq-btn mq-btn--lit" href="#/register">Реєстрація</a>
            </>
          )}
        </div>
      </header>
      <main className="mq-pub-main">{children}</main>
      <footer className="mq-pub-foot">
        <span>© 2026 MYSTIQ</span>
        <span>Відображення, а не передбачення. Не замінює лікаря чи психотерапевта.</span>
      </footer>
    </div>
  )
}

const FEATURES = [
  { glyph: '✧', title: 'Таро', text: 'Досліджуй архетипи та нові погляди.', to: 'tarot' },
  { glyph: '☾', title: 'Щоденник снів', text: 'Збережи образи, з якими прокидаєшся.', to: 'dreams' },
  { glyph: '☼', title: 'Астрологія', text: 'Символічна карта неба для самоспостереження.', to: 'astrology' },
  { glyph: '☄', title: 'AI-супутник', text: 'Роздуми через уважну розмову.', to: 'companion' },
]

export function Landing() {
  return (
    <>
      <section className="p-card p-hero-art p-landing" aria-label="Вітання">
        <div className="p-hero-copy">
          <span className="p-tag">ПРОСТІР ДЛЯ САМОПІЗНАННЯ</span>
          <h1>
            Твій внутрішній світ,<br />
            <span className="gold">м’яко відкритий.</span>
          </h1>
          <p className="p-sub">Збери роздуми, сни та космічні цікавинки в одному спокійному особистому просторі. MYSTIQ помічає образи й ритми, а не вгадує майбутнє.</p>
          <div className="p-actions">
            <a className="p-btn p-btn--primary" href="#/register">Почати подорож</a>
            <a className="p-btn" href="#/login">Увійти</a>
          </div>
        </div>
        <div className="p-moon p-moon--xl" aria-hidden="true">☾</div>
      </section>

      <div className="p-grid p-grid-4" style={{ marginTop: 15 }}>
        {FEATURES.map((f) => (
          <a key={f.title} href={`#/${f.to}`} className="p-card p-link">
            <div className="p-metric">{f.glyph}</div>
            <h3>{f.title}</h3>
            <p className="p-text">{f.text}</p>
          </a>
        ))}
      </div>

      <section className="p-card p-cta">
        <h2>Трохи більше інсайту. Трохи більше тебе.</h2>
        <p className="p-text">Почни з безкоштовних інструментів і збудуй практику, яка тобі підходить.</p>
        <a className="p-btn p-btn--primary" href="#/pricing">Дивитись тарифи</a>
      </section>
    </>
  )
}

function AuthCard({ title, sub, children, foot }) {
  return (
    <div className="mq-auth-wrap">
      <section className="mq-auth mq-plaque" aria-label={title}>
        <span className="mq-logo-mark mq-auth-mark" aria-hidden="true" />
        <h1>{title}</h1>
        <p className="muted">{sub}</p>
        {children}
        <p className="mq-auth-foot muted small">{foot}</p>
      </section>
    </div>
  )
}

// Спільна логіка форм: відправка, блокування кнопки, текст помилки сервера
function useSubmit(action) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await action()
      go('dashboard')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  return { error, busy, submit }
}

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const { error, busy, submit } = useSubmit(() => login(email, pass))
  return (
    <AuthCard
      title="Вітаємо знову"
      sub="Увійди, щоб продовжити свій шлях"
      foot={<>Ще немає акаунту? <a href="#/register">Зареєструватись</a></>}
    >
      <form onSubmit={submit}>
        <div className="mq-field">
          <label htmlFor="em">Email</label>
          <input id="em" type="email" required className="mq-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="mq-field">
          <label htmlFor="pw">Пароль</label>
          <input id="pw" type="password" required className="mq-input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="mq-form-error" role="alert">{error}</p>}
        <button className="mq-btn mq-btn--lit mq-block" type="submit" disabled={busy}>Увійти</button>
      </form>
    </AuthCard>
  )
}

export function Register() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [agree, setAgree] = useState(false)
  const { error, busy, submit } = useSubmit(() => register(name, email, pass))
  return (
    <AuthCard
      title="Створи свій акаунт"
      sub="Почни подорож до себе"
      foot={<>Уже є акаунт? <a href="#/login">Увійти</a></>}
    >
      <form onSubmit={(e) => (agree ? submit(e) : e.preventDefault())}>
        <div className="mq-field">
          <label htmlFor="rn">Ім’я</label>
          <input id="rn" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="mq-input" placeholder="Як до тебе звертатись?" />
        </div>
        <div className="mq-field">
          <label htmlFor="re">Email</label>
          <input id="re" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mq-input" placeholder="you@example.com" />
        </div>
        <div className="mq-field">
          <label htmlFor="rp">Пароль</label>
          <input id="rp" type="password" required minLength={8} value={pass} onChange={(e) => setPass(e.target.value)} className="mq-input" placeholder="Мінімум 8 символів" />
        </div>
        <div className="mq-consent" style={{ marginBottom: 18 }}>
          <label>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>Погоджуюсь з умовами використання та політикою конфіденційності</span>
          </label>
        </div>
        {error && <p className="mq-form-error" role="alert">{error}</p>}
        <button className="mq-btn mq-btn--lit mq-block" type="submit" disabled={!agree || busy}>Зареєструватись</button>
      </form>
    </AuthCard>
  )
}

const PLANS = [
  {
    id: 'free', name: 'Free', price: '0', note: 'Щоб познайомитись',
    items: ['Карта дня', 'Щоденник снів і настрою', 'Базова натальна карта', '10 повідомлень AI на тиждень'],
    cta: 'Обрати',
  },
  {
    id: 'plus', name: 'Plus', price: '9,99', note: 'Найпопулярніший', featured: true,
    items: ['Усі розклади Таро', 'Аналіз снів з пошуком образів', 'Місячні цикли й сумісність', 'AI-супутник без ліміту'],
    cta: 'Обрати',
  },
  {
    id: 'premium', name: 'Premium', price: '19,99', note: 'Максимум можливостей',
    items: ['Усе з Plus', 'Глибокі тематичні звіти', 'Експорт історії', 'Пріоритетна підтримка'],
    cta: 'Обрати',
  },
]

export function Pricing() {
  return (
    <>
      <section className="mq-price-head">
        <p className="mq-eyebrow">Тарифи</p>
        <h1>Обери свій тариф</h1>
        <p className="muted">Безкоштовно можна почати зараз. Змінити або скасувати план можна будь-коли.</p>
      </section>
      <section className="mq-plans" aria-label="Тарифи">
        {PLANS.map((p) => (
          <article key={p.id} className={`mq-plan mq-plaque ${p.featured ? 'is-featured' : ''}`}>
            {p.featured && <span className="mq-plan-badge">Популярний</span>}
            <h2>{p.name}</h2>
            <p className="muted small">{p.note}</p>
            <p className="mq-plan-price">
              <span>$</span>
              {p.price}
              <small>/міс</small>
            </p>
            <ul>
              {p.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
            <a className={`mq-btn mq-block ${p.featured ? 'mq-btn--lit' : ''}`} href="#/register">
              {p.cta}
            </a>
          </article>
        ))}
      </section>
    </>
  )
}
