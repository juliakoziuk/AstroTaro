import { createContext, useContext } from 'react'

const ThemeContext = createContext('light')

function Badge() {
  const theme = useContext(ThemeContext)
  return <p>Тема: «{theme}»</p>
}

export default function ProviderNoValue() {
  return (
    <ThemeContext>
      <Badge />
    </ThemeContext>
  )
}
