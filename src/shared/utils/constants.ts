import { Privilege, Permission, PRIVILEGE_PERMISSIONS, DisplayRole } from '@/shared/types'

export const APP_NAME = 'Infranest Portal'
export const ASSOCIATION_NAME = 'Infranest Apartment Association'
export const TOTAL_APARTMENTS = 61

export const FISCAL_YEARS = [
  'FY26-27', 'FY25-26', 'FY24-25', 'FY23-24', 'FY22-23', 'FY21-22', 'FY20-21',
  'FY19-20', 'FY18-19'
] as const
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
  'FY24-25': [
    'Apr-2024', 'May-2024', 'Jun-2024', 'Jul-2024', 'Aug-2024', 'Sep-2024',
    'Oct-2024', 'Nov-2024', 'Dec-2024', 'Jan-2025', 'Feb-2025', 'Mar-2025',
  ],
  'FY23-24': [
    'Apr-2023', 'May-2023', 'Jun-2023', 'Jul-2023', 'Aug-2023', 'Sep-2023',
    'Oct-2023', 'Nov-2023', 'Dec-2023', 'Jan-2024', 'Feb-2024', 'Mar-2024',
  ],
  'FY22-23': [
    'Apr-2022', 'May-2022', 'Jun-2022', 'Jul-2022', 'Aug-2022', 'Sep-2022',
    'Oct-2022', 'Nov-2022', 'Dec-2022', 'Jan-2023', 'Feb-2023', 'Mar-2023',
  ],
  'FY21-22': [
    'Apr-2021', 'May-2021', 'Jun-2021', 'Jul-2021', 'Aug-2021', 'Sep-2021',
    'Oct-2021', 'Nov-2021', 'Dec-2021', 'Jan-2022', 'Feb-2022', 'Mar-2022',
  ],
  'FY20-21': [
    'Apr-2020', 'May-2020', 'Jun-2020', 'Jul-2020', 'Aug-2020', 'Sep-2020',
    'Oct-2020', 'Nov-2020', 'Dec-2020', 'Jan-2021', 'Feb-2021', 'Mar-2021',
  ],
  'FY19-20': [
    'Apr-2019', 'May-2019', 'Jun-2019', 'Jul-2019', 'Aug-2019', 'Sep-2019',
    'Oct-2019', 'Nov-2019', 'Dec-2019', 'Jan-2020', 'Feb-2020', 'Mar-2020',
  ],
  'FY18-19': [
    'Apr-2018', 'May-2018', 'Jun-2018', 'Jul-2018', 'Aug-2018', 'Sep-2018',
    'Oct-2018', 'Nov-2018', 'Dec-2018', 'Jan-2019', 'Feb-2019', 'Mar-2019',
  ]
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
