import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/shared/components/AppLayout/AppLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute/ProtectedRoute'
import { LoginPage } from '@/features/auth/components/LoginPage'

const DashboardPage            = lazy(() => import('@/features/dashboard').then((m) => ({ default: m.DashboardPage })))
const FinancialSummaryPage     = lazy(() => import('@/features/financialSummary').then((m) => ({ default: m.FinancialSummaryPage })))
const ReportsPage           = lazy(() => import('@/features/reports').then((m) => ({ default: m.ReportsPage })))
const TransactionsPage      = lazy(() => import('@/features/transactions').then((m) => ({ default: m.TransactionsPage })))
const ConfigPage            = lazy(() => import('@/features/config').then((m) => ({ default: m.ConfigPage })))
const MMCPage               = lazy(() => import('@/features/mmc').then((m) => ({ default: m.MMCPage })))
const WaterPage             = lazy(() => import('@/features/water').then((m) => ({ default: m.WaterPage })))
const GasPage               = lazy(() => import('@/features/gas').then((m) => ({ default: m.GasPage })))

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
          <Route index element={<Navigate to="/financials/dashboard" replace />} />

          <Route path="financials/dashboard" element={
            <ProtectedRoute permission="view:transactions">
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="financials/reports" element={
            <ProtectedRoute permission="view:transactions">
              <ReportsPage />
            </ProtectedRoute>
          } />

          <Route path="financials/summary" element={
            <ProtectedRoute permission="view:transactions">
              <FinancialSummaryPage />
            </ProtectedRoute>
          } />

          <Route path="financials/transactions/*" element={
            <ProtectedRoute permission="view:transactions">
              <TransactionsPage />
            </ProtectedRoute>
          } />

          <Route path="collections/mmc" element={
            <ProtectedRoute permission="view:mmc">
              <MMCPage />
            </ProtectedRoute>
          } />

          <Route path="collections/water" element={
            <ProtectedRoute permission="view:mmc">
              <WaterPage />
            </ProtectedRoute>
          } />

          <Route path="collections/gas" element={
            <ProtectedRoute permission="view:mmc">
              <GasPage />
            </ProtectedRoute>
          } />

          <Route path="config" element={
            <ProtectedRoute permission="manage:config">
              <ConfigPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/financials/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}
