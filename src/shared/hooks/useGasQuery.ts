import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { gasClient } from '@/shared/services/gasClient'
import { useAuthStore } from '@/shared/store/authStore'

export function useGasQuery<T>(
  queryKey: unknown[],
  action: string,
  params: Record<string, string> = {},
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  const token = useAuthStore((s) => s.user?.idToken ?? '')

  return useQuery<T>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const data = await gasClient.get<T>(action, params, token)
      console.log(`[GAS] ${action}`, data)
      return data
    },
    enabled: !!token && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
