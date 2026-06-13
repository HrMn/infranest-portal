import { Privilege, Permission, PRIVILEGE_PERMISSIONS, DisplayRole } from '@/shared/types'

export const APP_NAME = 'Infranest Portal'
export const ASSOCIATION_NAME = 'Infranest Apartment Association'
export const TOTAL_APARTMENTS = 61

export const FISCAL_YEARS = ['FY26-27', 'FY25-26'] as const
export type FiscalYear = (typeof FISCAL_YEARS)[number]
export const DEFAULT_FY: FiscalYear = 'FY26-27'

export const FY_MONTHS: Record<FiscalYear, string[]> = {
  'FY26-27': [
    'Apr-2026', 'May-2026', 'Jun-2026', 'Jul-2026', 'Aug-2026', 'Sep-2026',
    'Oct-2026', 'Nov-2026', 'Dec-2026', 'Jan-2027', 'Feb-2027', 'Mar-2027',
  ],
  'FY25-26': [
    'Apr-2025', 'May-2025', 'Jun-2025', 'Jul-2025', 'Aug-2025', 'Sep-2025',
    'Oct-2025', 'Nov-2025', 'Dec-2025', 'Jan-2026', 'Feb-2026', 'Mar-2026',
  ],
}

export const INCOME_CATEGORIES = [
  'MMC Collection',
  'FD Interest',
  'Water Recovery',
  'Gas Recovery',
  'Donations',
  'Other Income',
] as const

export const EXPENSE_CATEGORIES = [
  'Electricity',
  'Gas Cylinder',
  'Water Tanker',
  'STP Operations',
  'Lift AMC',
  'Fire AMC',
  'STP AMC',
  'Security Charges',
  'Caretaker Charges',
  'Cleaning Charges',
  'Sewage Collection',
  'Plumbing',
  'Electrical Repairs',
  'Building Maintenance',
  'Miscellaneous',
] as const

export const DISPLAY_ROLE_LABELS: Record<DisplayRole, string> = {
  'President':        'President',
  'Secretary':        'Secretary',
  'Treasurer':        'Treasurer',
  'Committee Member': 'Committee Member',
  'Owner':            'Owner',
  'Tenant':           'Tenant',
  'Care Taker':       'Care Taker',
}

export const PRIVILEGE_LABELS: Record<Privilege, string> = {
  SuperAdmin: 'Super Admin',
  Admin:      'Admin',
  CT:         'Care Taker',
  User:       'User',
  Guest:      'Guest',
}

export function hasPermission(privilege: Privilege, permission: Permission): boolean {
  return PRIVILEGE_PERMISSIONS[privilege]?.includes(permission) ?? false
}

export const CHART_COLORS = {
  income: '#52c41a',
  expense: '#ff4d4f',
  surplus: '#1677ff',
  deficit: '#ff4d4f',
  mmc: '#722ed1',
  neutral: '#8c8c8c',
}

export const CATEGORY_COLORS: Record<string, string> = {
  'MMC Collection': '#1677ff',
  'FD Interest': '#52c41a',
  'Water Recovery': '#13c2c2',
  'Gas Recovery': '#fa8c16',
  Donations: '#722ed1',
  'Other Income': '#8c8c8c',
  Electricity: '#faad14',
  'Gas Cylinder': '#ff7a45',
  'Water Tanker': '#36cfc9',
  'STP Operations': '#597ef7',
  'Lift AMC': '#ff85c2',
  'Fire AMC': '#ff4d4f',
  'STP AMC': '#b37feb',
  'Security Charges': '#ffc53d',
  'Caretaker Charges': '#5cdbd3',
  'Cleaning Charges': '#95de64',
  'Sewage Collection': '#69b1ff',
  Plumbing: '#ff9c6e',
  'Electrical Repairs': '#ffd666',
  'Building Maintenance': '#d3adf7',
  Miscellaneous: '#bfbfbf',
}
