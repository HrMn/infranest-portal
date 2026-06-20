export interface BankStatementYear {
  fy:             string
  openingBalance: number | null
  closingBalance: number
  lastTxnDate:    string
  txnCount:       number
}

export interface BankStatementYearlySummary {
  years: BankStatementYear[]
}

export interface BankStatementMonthlyRow {
  month:          string        // "Apr-2025"
  monthKey:       string        // "04/2025"
  openingBalance: number | null
  closingBalance: number
}

export interface BankStatementFYDetail {
  openingBalance: number | null
  months:         BankStatementMonthlyRow[]
}

export interface BankStatementTransaction {
  date:        string        // "01 Apr"
  description: string
  debit:       number | null
  credit:      number | null
  balance:     number
}

export interface BankStatementFYDailyDetail {
  transactions: BankStatementTransaction[]
}
