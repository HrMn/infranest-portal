import { BrowserRouter } from 'react-router-dom'
import { Providers } from './providers'
import { AppRoutes } from './routes'
import { AuthRefresher } from '@/features/auth/components/AuthRefresher'

export default function App() {
  return (
    <BrowserRouter basename="/infranest-portal">
      <Providers>
        <AuthRefresher />
        <AppRoutes />
      </Providers>
    </BrowserRouter>
  )
}
