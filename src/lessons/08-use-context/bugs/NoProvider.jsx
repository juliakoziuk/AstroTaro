import { createContext, useContext } from 'react'

const ThemeContext = createContext()

function Badge() {
  const { theme } = useContext(ThemeContext)
  return <p>Тема: {theme}</p>
}

export default function NoProvider() {
  return <Badge />
}
