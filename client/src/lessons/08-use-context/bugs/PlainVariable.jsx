import { createContext, useContext } from 'react'

const ThemeContext = createContext(null)

function ThemeProvider({ children }) {
  let theme = 'light'
  const toggle = () => {
    theme = theme === 'light' ? 'dark' : 'light'
  }
  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
}

function Toggle() {
  const { theme, toggle } = useContext(ThemeContext)
  return <button onClick={toggle}>Тема: {theme} (натисни)</button>
}

export default function PlainVariable() {
  return (
    <ThemeProvider>
      <Toggle />
    </ThemeProvider>
  )
}
