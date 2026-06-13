export type DisplayRole =
  | 'President'
  | 'Secretary'
  | 'Treasurer'
  | 'Committee Member'
  | 'Owner'
  | 'Tenant'
  | 'Care Taker'

export type Privilege = 'SuperAdmin' | 'Admin' | 'CT' | 'User' | 'Guest'

export const DISPLAY_ROLES: DisplayRole[] = [
  'President',
  'Secretary',
  'Treasurer',
  'Committee Member',
  'Owner',
  'Tenant',
  'Care Taker',
]

export const DEFAULT_PRIVILEGE: Record<DisplayRole, Privilege> = {
  'President':        'Admin',
  'Secretary':        'Admin',
  'Treasurer':        'SuperAdmin',
  'Committee Member': 'Admin',
  'Owner':            'User',
  'Tenant':           'Guest',
  'Care Taker':       'CT',
}

export interface AuthUser {
  email:       string
  name:        string
  picture:     string
  idToken:     string
  displayRole: DisplayRole
  privilege:   Privilege
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
  | 'verify:transaction'
  | 'import:statement'
  | 'manage:users'
  | 'view:settings'
  | 'manage:config'

export const PRIVILEGE_PERMISSIONS: Record<Privilege, Permission[]> = {
  SuperAdmin: [
    'view:dashboard', 'view:reports', 'view:residents', 'view:mmc',
    'view:transactions', 'create:transaction', 'edit:transaction',
    'delete:transaction', 'verify:transaction', 'import:statement',
    'manage:users', 'view:settings', 'manage:config',
  ],
  Admin: [
    'view:dashboard', 'view:reports', 'view:residents', 'view:mmc',
    'view:transactions', 'verify:transaction',
  ],
  CT: [
    'view:dashboard', 'view:residents',
    'view:transactions', 'create:transaction',
  ],
  User:  ['view:dashboard'],
  Guest: ['view:dashboard'],
}
