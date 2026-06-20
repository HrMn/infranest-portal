import { useGasQuery } from '@/shared/hooks/useGasQuery'
import type {
  BankStatementYearlySummary,
  BankStatementFYDetail,
  BankStatementFYDailyDetail,
} from '@/shared/types'

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

export function useBankStatementDaily(fyCode: string | null, monthKey: string | null) {
  return useGasQuery<BankStatementFYDailyDetail>(
    ['bank-statement-daily', fyCode ?? '', monthKey ?? ''],
    'getBankStatementDaily',
    { fyCode: fyCode ?? '', monthKey: monthKey ?? '' },
    { enabled: !!fyCode && !!monthKey },
  )
}
