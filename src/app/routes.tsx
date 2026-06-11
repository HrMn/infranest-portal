import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { AppLayout } from '@/shared/components/AppLayout/AppLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute/ProtectedRoute'
import { LoginPage } from '@/features/auth/components/LoginPage'

const DashboardPage        = lazy(() => import('@/features/dashboard').then((m) => ({ default: m.DashboardPage })))
const MMCPage              = lazy(() => import('@/features/mmc').then((m) => ({ default: m.MMCPage })))
const ResidentDirectoryPage = lazy(() => import('@/features/residents').then((m) => ({ default: m.ResidentDirectoryPage })))
const ReportsPage          = lazy(() => import('@/features/reports').then((m) => ({ default: m.ReportsPage })))

const Loader = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
    <Spin size="large" />
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
          <Route index element={
            <ProtectedRoute permission="view:dashboard">
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="mmc" element={
            <ProtectedRoute permission="view:mmc">
              <MMCPage />
            </ProtectedRoute>
          } />

          <Route path="residents" element={
            <ProtectedRoute permission="view:residents">
              <ResidentDirectoryPage />
            </ProtectedRoute>
          } />

          <Route path="reports/*" element={
            <ProtectedRoute permission="view:reports">
              <ReportsPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
