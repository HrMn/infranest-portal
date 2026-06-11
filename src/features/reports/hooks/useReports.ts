import { useGasQuery } from '@/shared/hooks/useGasQuery'
import { useAppStore } from '@/shared/store/appStore'
import { MonthlyReport, CategoryBreakdown } from '@/shared/types'
import { MMCStatus } from '@/shared/types'

export function useMonthlyReport() {
  const fy = useAppStore((s) => s.selectedFY)
  return useGasQuery<MonthlyReport>(['report-monthly', fy], 'getMonthlyReport', { fy })
}

export function useIncomeBreakdown() {
  const fy = useAppStore((s) => s.selectedFY)
  return useGasQuery<CategoryBreakdown[]>(['report-income', fy], 'getIncomeBreakdown', { fy })
}

export function useExpenseBreakdown() {
  const fy = useAppStore((s) => s.selectedFY)
  return useGasQuery<CategoryBreakdown[]>(['report-expense', fy], 'getExpenseBreakdown', { fy })
}

export function useMMCReport() {
  const fy = useAppStore((s) => s.selectedFY)
  return useGasQuery<MMCStatus>(['report-mmc', fy], 'getMMCStatus', { fy })
}
