import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './submit-layout.css'
import './profile-layout.css'
import './support-layout.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
