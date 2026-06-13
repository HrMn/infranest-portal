import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/shared/components/AppLayout/AppLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute/ProtectedRoute'
import { LoginPage } from '@/features/auth/components/LoginPage'

const TransactionsPage      = lazy(() => import('@/features/transactions').then((m) => ({ default: m.TransactionsPage })))
const StatementAnalysisPage = lazy(() => import('@/features/statement-analysis').then((m) => ({ default: m.StatementAnalysisPage })))
const ConfigPage            = lazy(() => import('@/features/config').then((m) => ({ default: m.ConfigPage })))

const Loader = (
  <div className="flex items-center justify-center h-64">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
)

export function AppRoutes() {
  return (
    <Suspense fallback={Loader}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/transactions" replace />} />

          <Route path="transactions/*" element={
            <ProtectedRoute permission="view:transactions">
              <TransactionsPage />
            </ProtectedRoute>
          } />

          <Route path="statement-analysis" element={
            <ProtectedRoute permission="view:transactions">
              <StatementAnalysisPage />
            </ProtectedRoute>
          } />

          <Route path="config" element={
            <ProtectedRoute permission="manage:config">
              <ConfigPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/transactions" replace />} />
      </Routes>
    </Suspense>
  )
}
