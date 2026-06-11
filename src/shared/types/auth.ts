export enum Role {
  TREASURER = 'TREASURER',
  COMMITTEE = 'COMMITTEE',
  CARETAKER = 'CARETAKER',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
}

export interface AuthUser {
  email: string
  name: string
  picture: string
  role: Role
  idToken: string
}

export type Permission =
  | 'view:dashboard'
  | 'view:reports'
  | 'view:residents'
  | 'view:mmc'
  | 'view:transactions'
  | 'create:transaction'
  | 'edit:transaction'
  | 'delete:transaction'
  | 'manage:users'
  | 'view:settings'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.TREASURER]: [
    'view:dashboard',
    'view:reports',
    'view:residents',
    'view:mmc',
    'view:transactions',
    'create:transaction',
    'edit:transaction',
    'delete:transaction',
    'manage:users',
    'view:settings',
  ],
  [Role.COMMITTEE]: [
    'view:dashboard',
    'view:reports',
    'view:residents',
    'view:mmc',
    'view:transactions',
  ],
  [Role.CARETAKER]: ['view:dashboard', 'view:residents'],
  [Role.OWNER]: [],
  [Role.TENANT]: [],
}
