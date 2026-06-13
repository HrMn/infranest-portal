import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/store/authStore'
import { gasClient } from '@/shared/services/gasClient'
import { useGasQuery } from '@/shared/hooks/useGasQuery'
import { Transaction, TransactionCreatePayload, ParsedStatementRow } from '@/shared/types'

function txnKey(fy: string): unknown[] {
  return ['transactions', fy]
}

export function useTransactions(fy: string) {
  return useGasQuery<Transaction[]>(txnKey(fy), 'getTransactions', { fy })
}

export function useCreateTransaction(fy: string) {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')

  return useMutation({
    mutationFn: (payload: TransactionCreatePayload) =>
      gasClient.post<{ rowIndex: number }>('createTransaction', { ...payload, fy }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: txnKey(fy) }),
  })
}

export function useUpdateTransaction(fy: string) {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')

  return useMutation({
    mutationFn: (payload: Partial<TransactionCreatePayload> & { rowIndex: number }) =>
      gasClient.post<{ ok: boolean }>('updateTransaction', { ...payload, fy }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: txnKey(fy) }),
  })
}

export function useDeleteTransaction(fy: string) {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')

  return useMutation({
    mutationFn: (rowIndex: number) =>
      gasClient.post<{ ok: boolean }>('deleteTransaction', { rowIndex, fy }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: txnKey(fy) }),
  })
}

/** Create a single transaction where fy is determined by the caller (e.g. derived from the date). */
export function useCreateTransactionDynamic() {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')

  return useMutation({
    mutationFn: (payload: TransactionCreatePayload & { fy: string }) =>
      gasClient.post<{ rowIndex: number }>('createTransaction', payload, token),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: txnKey(vars.fy) }),
  })
}

export function useImportTransactions(fy: string) {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')

  return useMutation({
    mutationFn: (rows: ParsedStatementRow[]) => {
      const mapped = rows.map((r) => ({
        date:        r.date,
        particulars: r.particulars,
        expenditure: r.expenditure,
        income:      r.income,
        paymentMode: r.paymentMode || 'Online',
        paymentType: r.income ? 'Credit' : 'Debit',
        apartment:   r.apartment || '',
        receiptNo:   '',
        voucherNo:   '',
        remarks:     '',
        status:      'Pending Verification',
      }))
      return gasClient.post<{ imported: number }>('importTransactions', { rows: mapped, fy }, token)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: txnKey(fy) }),
  })
}
