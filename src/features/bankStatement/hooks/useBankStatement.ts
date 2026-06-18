import { useGasQuery } from '@/shared/hooks/useGasQuery'
import type { BankStatementYearlySummary, BankStatementFYDetail } from '@/shared/types'

export function useBankStatementSummary() {
  return useGasQuery<BankStatementYearlySummary>(
    ['bank-statement-summary'],
    'getBankStatementSummary',
    {},
  )
}

export function useBankStatementMonthly(fyCode: string | null) {
  return useGasQuery<BankStatementFYDetail>(
    ['bank-statement-monthly', fyCode ?? ''],
    'getBankStatementMonthly',
    { fyCode: fyCode ?? '' },
    { enabled: !!fyCode },
  )
}
