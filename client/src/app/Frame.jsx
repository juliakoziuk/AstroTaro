import { navProps } from './router.js'
import scene from './art/draw-scene.webp'
import logo from './art/draw-logo.webp'
import NavLinks from './NavLinks.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import './draw.css'

function Sidebar() {
  return (
    <aside className="side">
      <a className="logo" {...navProps('/dashboard')} aria-label="MYSTIQ">
        <img src={logo} alt="MYSTIQ" />
      </a>
      <NavLinks />
      <ThemeToggle className="side-theme" />
    </aside>
  )
}

/** Рамка екранів у стилі «Draw your cards»: сцена-фон, бічна панель і центральна колонка. */
export default function Frame({ children }) {
  return (
    <div className="v-app">
      <div className="drawpage" style={{ '--scene': `url(${scene})` }}>
        <Sidebar />
        <main className="draw">{children}</main>
      </div>
    </div>
  )
}
