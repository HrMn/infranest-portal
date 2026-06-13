import { useGasQuery } from '@/shared/hooks/useGasQuery'
import { AptMappingEntry } from '@/shared/utils/aptMapper'

interface AptMappingResponse {
  mappings: AptMappingEntry[]
}

export function useAptMapping(fy: string, enabled = true) {
  return useGasQuery<AptMappingResponse>(
    ['aptMapping', fy],
    'getAptMapping',
    { fy },
    { enabled, staleTime: 30 * 60 * 1000 },
  )
}
