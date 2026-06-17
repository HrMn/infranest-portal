import { useGasQuery } from '@/shared/hooks/useGasQuery'
import type { FinancialSummaryOverall, FinancialSummaryDetail } from '@/shared/types'

export function useFinancialSummaryOverall() {
  return useGasQuery<FinancialSummaryOverall>(
    ['financial-summary'],
    'getFinancialSummary',
    {},
  )
}

export function useFinancialSummaryDetail(fyLabel: string | null) {
  return useGasQuery<FinancialSummaryDetail>(
    ['financial-summary-detail', fyLabel ?? ''],
    'getFinancialSummaryDetail',
    { fyLabel: fyLabel ?? '' },
    { enabled: !!fyLabel },
  )
}
