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

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function monthLabel(ddMmYyyy: string): string {
  const m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ''
  const mon = MONTH_LABELS[parseInt(m[2]) - 1]
  return mon ? `${mon}-${m[3]}` : ''
}

const INCOME_TYPE_MAP: Array<{ re: RegExp; prefix: string; category: string }> = [
  { re: /\bmmc\b|maintenance.*charge|flat.*collection/i, prefix: 'MMC',    category: 'MMC'        },
  { re: /water recovery|water charge|\bwater\b/i,         prefix: 'Water',  category: 'WaterUsage' },
  { re: /gas recovery|gas charge/i,                        prefix: 'Gas',    category: 'GasUsage'   },
  { re: /\bcorpus\b/i,                                     prefix: 'Corpus', category: 'CorpusFund' },
]

/** Resolves both formatted particulars and the matched category for a statement row.
 *  Returns the original values unchanged for expenses and unrecognised income. */
export function resolveIncomeInfo(
  description:      string,
  existingCategory: string,
  apartment:        string,
  date:             string,
  isIncome:         boolean,
): { particulars: string; category: string } {
  if (!isIncome) return { particulars: description, category: existingCategory }
  const apt   = apartment || '?'
  const month = monthLabel(date)
  const haystack = `${existingCategory} ${description}`
  for (const { re, prefix, category } of INCOME_TYPE_MAP) {
    if (re.test(haystack)) {
      const particulars = month ? `${prefix} - ${apt} - ${month}` : `${prefix} - ${apt}`
      return { particulars, category }
    }
  }
  return { particulars: description, category: existingCategory }
}

export function generateParticulars(
  description: string,
  category:    string,
  apartment:   string,
  date:        string,
  isIncome:    boolean,
): string {
  return resolveIncomeInfo(description, category, apartment, date, isIncome).particulars
}
