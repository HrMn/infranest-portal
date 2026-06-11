import { useGasQuery } from '@/shared/hooks/useGasQuery'
import { useAppStore } from '@/shared/store/appStore'
import { Resident } from '@/shared/types'

export function useResidents() {
  const fy = useAppStore((s) => s.selectedFY)
  return useGasQuery<Resident[]>(['residents', fy], 'getResidents', { fy })
}
