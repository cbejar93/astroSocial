import './index.css'
import { StrictMode }     from 'react'
import { createRoot }     from 'react-dom/client'
import { BrowserRouter }  from 'react-router-dom'
import App                from './App'
import { AuthProvider }   from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>
)
