import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/store/authStore'
import { Permission } from '@/shared/types'
import { hasPermission } from '@/shared/utils/constants'

interface Props {
  children: React.ReactNode
  permission?: Permission
}

export function ProtectedRoute({ children, permission }: Props) {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (permission && !hasPermission(user.privilege, permission)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
