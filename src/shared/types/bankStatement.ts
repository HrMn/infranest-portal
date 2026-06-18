export interface BankStatementYear {
  fy:             string
  closingBalance: number
  txnCount:       number
}

export interface BankStatementYearlySummary {
  years: BankStatementYear[]
}

export interface BankStatementMonthlyRow {
  month:   string
  balance: number
}

export interface BankStatementFYDetail {
  months: BankStatementMonthlyRow[]
}
