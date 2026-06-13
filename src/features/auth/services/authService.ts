import { gasClient } from '@/shared/services/gasClient'
import { AuthUser, DisplayRole, Privilege } from '@/shared/types'

interface UserRoleResponse {
  email:       string
  displayRole: string
  privilege:   string
  name:        string
}

export async function fetchUserRole(idToken: string, name: string, picture: string): Promise<AuthUser> {
  const data = await gasClient.get<UserRoleResponse>('getUserRole', {}, idToken)
  return {
    email:       data.email,
    name:        data.name || name,
    picture,
    displayRole: data.displayRole as DisplayRole,
    privilege:   data.privilege   as Privilege,
    idToken,
  }
}
