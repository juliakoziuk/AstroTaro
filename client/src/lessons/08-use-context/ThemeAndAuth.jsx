import { createContext, useContext, useState } from 'react'

// 1. Створюємо контексти (за замовчуванням — null, щоб помітити забутий Provider)
const ThemeContext = createContext(null)
const AuthContext = createContext(null)

// 2. Provider тримає state і віддає його вниз усьому піддереву
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const login = (name) => setUser({ name })
  const logout = () => setUser(null)
  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>
}

// 3. Власні хуки: зручно + захист від використання поза Provider
function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme потрібно викликати всередині <ThemeProvider>')
  return ctx
}

function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth потрібно викликати всередині <AuthProvider>')
  return ctx
}

// 4. Глибоко вкладені компоненти беруть дані напряму, без передачі props через проміжні рівні
function Header() {
  const { user, login, logout } = useAuth()
  return (
    <div className="row">
      <strong>Мій сайт</strong>
      <span style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            Привіт, {user.name}! <button onClick={logout}>Вийти</button>
          </>
        ) : (
          <button onClick={() => login('Олена')}>Увійти як Олена</button>
        )}
      </span>
    </div>
  )
}

function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()
  return <button onClick={toggleTheme}>Тема: {theme === 'light' ? '☀️ світла' : '🌙 темна'}</button>
}

function DeepChild() {
  const { theme } = useTheme()
  const { user } = useAuth()
  return (
    <div className={theme === 'light' ? 'themed-light' : 'themed-dark'}>
      Я «глибокий» компонент. Тема: <b>{theme}</b>, користувач: <b>{user ? user.name : 'гість'}</b>
    </div>
  )
}

// Проміжні компоненти НЕ знають про theme і user: нічого не передають
function Sidebar() {
  return (
    <div style={{ padding: '10px 0' }}>
      <ThemeSwitch />
      <div style={{ marginTop: 10 }}>
        <Content />
      </div>
    </div>
  )
}

function Content() {
  return <DeepChild />
}

export default function ThemeAndAuth() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Header />
        <Sidebar />
      </AuthProvider>
    </ThemeProvider>
  )
}
