import { gasClient } from '@/shared/services/gasClient'
import { AuthUser, Role } from '@/shared/types'

interface UserRoleResponse {
  email: string
  role: string
  name: string
}

export async function fetchUserRole(idToken: string, name: string, picture: string): Promise<AuthUser> {
  const data = await gasClient.get<UserRoleResponse>('getUserRole', {}, idToken)
  return {
    email: data.email,
    name: data.name || name,
    picture,
    role: data.role as Role,
    idToken,
  }
}
