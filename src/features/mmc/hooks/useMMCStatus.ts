import { useGasQuery } from '@/shared/hooks/useGasQuery'
import { useAppStore } from '@/shared/store/appStore'
import { MMCStatus } from '@/shared/types'

export function useMMCStatus() {
  const fy = useAppStore((s) => s.selectedFY)
  return useGasQuery<MMCStatus>(['mmc', fy], 'getMMCStatus', { fy })
}
