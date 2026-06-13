import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/store/authStore'
import { gasClient } from '@/shared/services/gasClient'
import { useGasQuery } from '@/shared/hooks/useGasQuery'
import { ConfigItem, AppUser } from '@/shared/types'

// ── Config Data ───────────────────────────────────────────────────────────────

export function useConfigData(fy: string, configType?: string) {
  const params: Record<string, string> = { fy }
  if (configType) params.configType = configType
  return useGasQuery<{ items: ConfigItem[] }>(
    ['configData', fy, configType ?? 'all'],
    'getConfigData',
    params,
  )
}

export function useUpsertConfigItem(fy: string) {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')
  return useMutation({
    mutationFn: (item: Omit<ConfigItem, 'rowIndex'> & { rowIndex?: number }) =>
      gasClient.post<{ ok: boolean }>('upsertConfigItem', { ...item, fy }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configData'] }),
  })
}

export function useDeleteConfigItem(fy: string) {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')
  return useMutation({
    mutationFn: (rowIndex: number) =>
      gasClient.post<{ ok: boolean }>('deleteConfigItem', { rowIndex, fy }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['configData'] }),
  })
}

// ── User Roles ────────────────────────────────────────────────────────────────

export function useAppUsers() {
  return useGasQuery<AppUser[]>(['appUsers'], 'getUsers', {})
}

export function useUpsertUser() {
  const qc    = useQueryClient()
  const token = useAuthStore((s) => s.user?.idToken ?? '')
  return useMutation({
    mutationFn: (u: { email: string; displayRole: string; privilege: string; name: string }) =>
      gasClient.post<{ ok: boolean }>('upsertUser', u, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appUsers'] }),
  })
}
