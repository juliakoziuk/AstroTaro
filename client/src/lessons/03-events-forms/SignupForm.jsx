import { useState } from 'react'

const initialForm = { name: '', email: '', city: 'kyiv', about: '', agree: false }

// Форма реєстрації: усі поля «контрольовані» (значення живе в state)
export default function SignupForm() {
  const [form, setForm] = useState(initialForm)
  const [touched, setTouched] = useState({})
  const [sent, setSent] = useState(null)

  // Один обробник на всі поля: назва поля береться з атрибута name
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  function handleBlur(e) {
    setTouched({ ...touched, [e.target.name]: true })
  }

  // Помилки не зберігаємо в state — вони обчислюються з form
  const errors = {}
  if (form.name.trim().length < 2) errors.name = 'Мінімум 2 символи'
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Некоректний email'
  if (!form.agree) errors.agree = 'Потрібна згода з умовами'
  const isValid = Object.keys(errors).length === 0

  function handleSubmit(e) {
    e.preventDefault() // без цього браузер перезавантажить сторінку
    if (!isValid) return
    setSent(form)
    setForm(initialForm)
    setTouched({})
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="name">Ім’я</label>
        <input id="name" name="name" type="text" value={form.name} onChange={handleChange} onBlur={handleBlur} />
        {touched.name && errors.name && <span className="err">{errors.name}</span>}
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} />
        {touched.email && errors.email && <span className="err">{errors.email}</span>}
      </div>

      <div className="field">
        <label htmlFor="city">Місто</label>
        <select id="city" name="city" value={form.city} onChange={handleChange}>
          <option value="kyiv">Київ</option>
          <option value="lviv">Львів</option>
          <option value="odesa">Одеса</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="about">Про себе ({form.about.length}/100)</label>
        <textarea id="about" name="about" maxLength={100} value={form.about} onChange={handleChange} />
      </div>

      <label>
        <input name="agree" type="checkbox" checked={form.agree} onChange={handleChange} onBlur={handleBlur} /> Погоджуюсь з
        умовами
      </label>
      {touched.agree && errors.agree && <div className="err">{errors.agree}</div>}

      <div className="row">
        <button type="submit" disabled={!isValid}>
          Зареєструватися
        </button>
        {!isValid && <span className="muted">кнопка активна, коли немає помилок</span>}
      </div>

      {sent && (
        <p className="okmsg">
          Готово! {sent.name} ({sent.email}), місто: {sent.city}
        </p>
      )}
    </form>
  )
}
