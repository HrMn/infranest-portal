export interface MonthlyTrendPoint {
  month: string
  income: number
  expense: number
  surplus: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
}

export interface DashboardSummary {
  currentMonth: {
    label: string
    income: number
    expense: number
    surplus: number
  }
  mmcCollection: {
    collected: number
    total: number
    percentage: number
  }
  monthlyTrend: MonthlyTrendPoint[]
  incomeBreakdown: CategoryBreakdown[]
  expenseBreakdown: CategoryBreakdown[]
}

export interface MonthlySummaryRow {
  month: string
  income: number
  expense: number
  surplus: number
  cumulativeBalance: number
}

export interface MonthlyReport {
  fy: string
  rows: MonthlySummaryRow[]
  totals: { income: number; expense: number; surplus: number }
}
