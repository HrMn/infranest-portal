import { useGasQuery } from '@/shared/hooks/useGasQuery'
import { useAppStore } from '@/shared/store/appStore'
import { DashboardSummary } from '@/shared/types'

export function useDashboardSummary() {
  const fy = useAppStore((s) => s.selectedFY)
  return useGasQuery<DashboardSummary>(
    ['dashboard', fy],
    'getDashboardSummary',
    { fy },
  )
}
