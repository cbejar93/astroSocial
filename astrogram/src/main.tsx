import './index.css'
import { StrictMode }     from 'react'
import { createRoot }     from 'react-dom/client'
import { BrowserRouter }  from 'react-router-dom'
import App                from './App'
import { AuthProvider }   from './contexts/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
