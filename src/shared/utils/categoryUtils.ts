import { TransactionCategory } from '@/shared/types'

const INCOME_PATTERNS: Array<[RegExp, TransactionCategory]> = [
  [/mmc|maintenance/i, 'MMC Collection'],
  [/fd interest|fixed deposit interest/i, 'FD Interest'],
  [/water recovery|water charge/i, 'Water Recovery'],
  [/gas recovery|gas charge/i, 'Gas Recovery'],
  [/donation/i, 'Donations'],
]

const EXPENSE_PATTERNS: Array<[RegExp, TransactionCategory]> = [
  [/electricity|eb |power/i, 'Electricity'],
  [/gas cylinder|lpg/i, 'Gas Cylinder'],
  [/water tanker|tanker/i, 'Water Tanker'],
  [/stp operation/i, 'STP Operations'],
  [/lift amc|elevator/i, 'Lift AMC'],
  [/fire amc|fire safety/i, 'Fire AMC'],
  [/stp amc/i, 'STP AMC'],
  [/security/i, 'Security Charges'],
  [/caretaker/i, 'Caretaker Charges'],
  [/clean/i, 'Cleaning Charges'],
  [/sewage/i, 'Sewage Collection'],
  [/plumb/i, 'Plumbing'],
  [/electrical repair/i, 'Electrical Repairs'],
  [/building maint|maintenance/i, 'Building Maintenance'],
]

export function resolveCategory(particulars: string, isIncome: boolean): TransactionCategory | string {
  const patterns = isIncome ? INCOME_PATTERNS : EXPENSE_PATTERNS
  for (const [pattern, category] of patterns) {
    if (pattern.test(particulars)) return category
  }
  return isIncome ? 'Other Income' : 'Miscellaneous'
}
