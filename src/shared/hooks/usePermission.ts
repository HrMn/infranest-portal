import { useAuthStore } from '@/shared/store/authStore'
import { Permission } from '@/shared/types'
import { hasPermission } from '@/shared/utils/constants'

export function usePermission(permission: Permission): boolean {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  return hasPermission(user.role, permission)
}
