import { useState } from 'react'

export default function CheckboxValue() {
  const [agree, setAgree] = useState(false)

  return (
    <label>
      <input type="checkbox" onChange={(e) => setAgree(e.target.value)} /> Погоджуюсь з умовами
      <p>Статус: {agree ? 'згоден' : 'не згоден'}</p>
    </label>
  )
}
