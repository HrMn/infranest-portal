import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/store/authStore'
import { gasClient } from '@/shared/services/gasClient'
import { useGasQuery } from '@/shared/hooks/useGasQuery'
import type { MMCStatus, MMCPaid, MMCRates } from '@/shared/types'

function mmcStatusKey(fy: string): unknown[] { return ['mmc-status', fy] }
function mmcPaidKey(fy: string):   unknown[] { return ['mmc-paid',   fy] }

export function useMMCStatus(fy: string) {
  return useGasQuery<MMCStatus>(mmcStatusKey(fy), 'getMMCStatus', { fy })
}

export function useMMCPaid(fy: string) {
  return useGasQuery<MMCPaid>(mmcPaidKey(fy), 'getMMCPaid', { fy })
}

export function useMMCRates(fy: string) {
  return useGasQuery<MMCRates>(['mmc-rates', fy], 'getMMCRates', { fy })
}

export function useUpdateMMCPayment(fy: string) {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')

  return useMutation({
    mutationFn: (payload: { apartment: string; month: string; amount: number }) =>
      gasClient.post<{ ok: boolean }>('updateMMCPayment', { ...payload, fy } as unknown as Record<string, unknown>, token),
    onSuccess: () => {
      // Writing to MMC tab affects both paid view (direct) and dues view (via Pending MMC formulas)
      qc.invalidateQueries({ queryKey: mmcStatusKey(fy) })
      qc.invalidateQueries({ queryKey: mmcPaidKey(fy) })
    },
  })
}
