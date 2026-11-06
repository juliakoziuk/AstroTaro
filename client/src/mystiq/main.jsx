import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './mystiq.css'
import './skin.css'
import './skin-dream.css'
import './skin-night.css'
import './skin-pages.css'
import './skin-proto.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
