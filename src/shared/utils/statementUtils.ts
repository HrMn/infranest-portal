import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './constants'

const INCOME_PATTERNS: Array<[RegExp, string]> = [
  [/mmc|maintenance charge|flat.*collection/i,   'MMC Collection'],
  [/fd interest|fixed deposit interest/i,         'FD Interest'],
  [/water recovery|water charge/i,                'Water Recovery'],
  [/gas recovery|gas charge/i,                    'Gas Recovery'],
  [/donation/i,                                   'Donations'],
]

const EXPENSE_PATTERNS: Array<[RegExp, string]> = [
  [/electricity|eb |power bill|bescom|tneb/i,     'Electricity'],
  [/gas cylinder|lpg/i,                           'Gas Cylinder'],
  [/water tanker|tanker/i,                        'Water Tanker'],
  [/stp operation/i,                              'STP Operations'],
  [/lift amc|elevator/i,                          'Lift AMC'],
  [/fire amc|fire safety/i,                       'Fire AMC'],
  [/stp amc/i,                                    'STP AMC'],
  [/security/i,                                   'Security Charges'],
  [/caretaker/i,                                  'Caretaker Charges'],
  [/clean/i,                                      'Cleaning Charges'],
  [/sewage/i,                                     'Sewage Collection'],
  [/plumb/i,                                      'Plumbing'],
  [/electrical repair/i,                          'Electrical Repairs'],
  [/building maint/i,                             'Building Maintenance'],
]

export function guessCategory(particulars: string, isIncome: boolean): string {
  const patterns = isIncome ? INCOME_PATTERNS : EXPENSE_PATTERNS
  for (const [regex, cat] of patterns) {
    if (regex.test(particulars)) return cat
  }
  return isIncome ? 'Other Income' : 'Miscellaneous'
}

export const ALL_CATEGORIES: string[] = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
]
