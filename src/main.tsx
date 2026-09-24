import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import { Privacy } from './pages/Privacy.tsx'
import { Support } from './pages/Support.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* /privacy and /support are matched HERE, before App — App's own routing is entirely
          gated behind auth status (see App.tsx: an unauthenticated user never reaches its
          <Routes> at all, it renders <Auth/> instead). Routing these two pages outside App
          is what makes them reachable without logging in, with no risk of an auth redirect
          ever intercepting them — they don't run through App's auth/data-loading logic at all. */}
      <Routes>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
