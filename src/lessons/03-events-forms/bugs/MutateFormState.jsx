import { useState } from 'react'

export default function MutateFormState() {
  const [form, setForm] = useState({ name: '' })

  function handleChange(e) {
    form.name = e.target.value
    setForm(form)
  }

  return (
    <div>
      <input type="text" value={form.name} onChange={handleChange} placeholder="Введи ім’я" />
      <p>Ім’я: {form.name}</p>
    </div>
  )
}
