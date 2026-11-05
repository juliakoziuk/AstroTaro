import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lessons.css'
import LessonApp from './LessonApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LessonApp />
  </StrictMode>,
)
