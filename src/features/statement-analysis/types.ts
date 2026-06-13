export interface AnalysisFile {
  id: number
  filename: string
  uploadedAt: string   // ISO string
  rowCount: number
  dateFrom: string     // DD/MM/YYYY — earliest transaction in this file
  dateTo: string       // DD/MM/YYYY — latest transaction in this file
}

export interface AnalysisRow {
  id: number
  fileId: number
  date: string            // DD/MM/YYYY
  vendorName: string      // extracted short name for display
  rawDescription: string  // full original particulars (shown on hover)
  expenditure: number | null
  income: number | null
  balance: number | null
  category: string
}

export interface AnalysisFilter {
  fys: string[]                      // e.g. ['FY22-23', 'FY24-25']
  month: number | null               // 1–12; null = all months
  dateRange: [string, string] | null // [DD/MM/YYYY, DD/MM/YYYY] overrides fys+month
  minAmount: number                  // exclude transactions below this
  topN: number                       // 10 or 20 for top-parties charts
}

export interface PartyAggregate {
  vendorName: string
  rawDescription: string  // representative raw description for tooltip
  totalAmount: number
  count: number
}

export interface MonthlyStat {
  monthLabel: string      // "Apr 2022"
  sortKey: string         // "2022-04" for chronological sort
  type: 'Income' | 'Expense'
  amount: number
}

export interface CategoryStat {
  category: string
  amount: number
  count: number
}
