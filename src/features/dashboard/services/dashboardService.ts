import { gasClient } from '@/shared/services/gasClient'
import { DashboardSummary } from '@/shared/types'

export function fetchDashboardSummary(
  fy: string,
  token: string,
): Promise<DashboardSummary> {
  return gasClient.get<DashboardSummary>('getDashboardSummary', { fy }, token)
}
