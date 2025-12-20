import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './keys'

export interface Integration {
  company_id: string
  company_name: string
  google_drive: {
    connected: boolean
    folder_id: string | null
    folder_name: string | null
  }
}

async function fetchIntegrations(): Promise<Integration[]> {
  const response = await fetch('/api/integrations')
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Failed to fetch integrations')
  return result.data || []
}

export function useIntegrations() {
  return useQuery({
    queryKey: queryKeys.integrations,
    queryFn: fetchIntegrations,
  })
}

export function useRefreshIntegrations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Just invalidate to refetch
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations })
    },
  })
}
