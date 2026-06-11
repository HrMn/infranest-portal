import { BrowserRouter } from 'react-router-dom'
import { Providers } from './providers'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter basename="/infranest-portal">
      <Providers>
        <AppRoutes />
      </Providers>
    </BrowserRouter>
  )
}
