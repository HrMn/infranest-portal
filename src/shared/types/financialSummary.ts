export interface FinancialSummaryRow {
  fy:                string
  openingCashInHand: number | null
  openingBank:       number | null
  openingTotal:      number | null
  closingCashInHand: number | null
  closingBank:       number | null
  closingTotal:      number | null
}

export interface FinancialSummaryOverall {
  rows: FinancialSummaryRow[]
}

export interface FinancialMonthRow {
  month:             string
  incomeCashInHand:  number | null
  incomeBank:        number | null
  incomeTotal:       number | null
  expenseCashInHand: number | null
  expenseBank:       number | null
  expenseTotal:      number | null
}

export interface FinancialSummaryValues {
  cashInHand: number | null
  bank:       number | null
  total:      number | null
}

export interface FinancialSummaryFooter {
  difference:     FinancialSummaryValues
  carryForward:   FinancialSummaryValues
  closingBalance: FinancialSummaryValues
}

export interface FinancialSummaryDetail {
  months:  FinancialMonthRow[]
  summary: FinancialSummaryFooter | null
}
