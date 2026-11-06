import './app.css'
import Screen from './Screen.jsx'

/** Оболонка екрана за макетом: рівний темний фон заповнює поля на екранах ширших/вищих за макет. */
export default function Shell({ d, live }) {
  return (
    <div className="v-app">
      <div className="page">
        <div className="ambient" aria-hidden="true" />
        <Screen d={d} live={live} />
      </div>
    </div>
  )
}
