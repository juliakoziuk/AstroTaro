import { createContext, memo, useContext, useState } from 'react'
import { RenderBadge } from '../../ui.jsx'

const UserContext = createContext(null)

// Споживач, який у вигляді не залежить від лічильника, а оновлюється разом з ним
const Consumer = memo(function Consumer() {
  const user = useContext(UserContext)
  return (
    <p>
      Я показую лише ім’я «{user.name}». <RenderBadge label="Мої рендери" />
    </p>
  )
})

export default function NewValueEveryRender() {
  const [clicks, setClicks] = useState(0)

  return (
    <UserContext value={{ name: 'Олена' }}>
      <button onClick={() => setClicks(clicks + 1)}>Незв’язаний лічильник: {clicks}</button>
      <Consumer />
    </UserContext>
  )
}
