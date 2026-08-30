import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import './submit-layout.css'
import './profile-layout.css'
import './support-layout.css'
import './legal/legal.css'
import App from './App.jsx'
import PrivacyPolicy from './legal/PrivacyPolicy.jsx'
import TermsOfService from './legal/TermsOfService.jsx'
import RefundPolicy from './legal/RefundPolicy.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/*" element={<App />} />
      </Routes>
      <ToastContainer position="top-center" autoClose={6000} theme="colored" />
    </BrowserRouter>
  </StrictMode>,
)
