import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/store/authStore'
import { gasClient } from '@/shared/services/gasClient'
import { useGasQuery } from '@/shared/hooks/useGasQuery'
import type { MMCStatus } from '@/shared/types'

function mmcKey(fy: string): unknown[] {
  return ['mmc', fy]
}

export function useMMCStatus(fy: string) {
  return useGasQuery<MMCStatus>(mmcKey(fy), 'getMMCStatus', { fy })
}

export function useUpdateMMCPayment(fy: string) {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')

  return useMutation({
    mutationFn: (payload: { apartment: string; month: string; amount: number }) =>
      gasClient.post<{ ok: boolean }>('updateMMCPayment', { ...payload, fy } as unknown as Record<string, unknown>, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: mmcKey(fy) }),
  })
}
