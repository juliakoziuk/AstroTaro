import { useState } from 'react'
import lessons from './lessons/index.js'
import { ErrorBoundary } from './lessons/ui.jsx'

function initialLessonId() {
  const fromHash = lessons.find((l) => l.Page && l.id === location.hash.slice(1))
  return (fromHash ?? lessons[0]).id
}

export default function LessonApp() {
  const [id, setId] = useState(initialLessonId)
  const lesson = lessons.find((l) => l.id === id)

  function select(nextId) {
    setId(nextId)
    history.replaceState(null, '', `#${nextId}`)
    window.scrollTo(0, 0)
  }

  return (
    <div className="shell">
      <nav className="sidebar">
        <h1 className="brand">React за годину</h1>
        <ol>
          {lessons.map((l) => (
            <li key={l.id}>
              <button
                className={l.id === id ? 'nav-btn active' : 'nav-btn'}
                disabled={!l.Page}
                onClick={() => select(l.id)}
              >
                <span>{l.title}</span>
                <small>{l.minutes} хв</small>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <main className="content">
        <ErrorBoundary key={id}>
          <lesson.Page />
        </ErrorBoundary>
      </main>
    </div>
  )
}
