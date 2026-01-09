import './index.css'
import { StrictMode }     from 'react'
import { createRoot }     from 'react-dom/client'
import { BrowserRouter }  from 'react-router-dom'
import App                from './App'
import { AuthProvider }   from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { AnalyticsProvider } from './contexts/AnalyticsContext'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AnalyticsProvider>
              <App />
            </AnalyticsProvider>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
)
