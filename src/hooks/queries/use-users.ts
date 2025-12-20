import { useQuery } from '@tanstack/react-query'
import { queryKeys, type UserFilters } from './keys'

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

interface UsersResponse {
  data: User[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchUsers(filters?: UserFilters): Promise<User[]> {
  const params = new URLSearchParams()
  if (filters?.role && filters.role !== 'all') params.set('role', filters.role)

  const response = await fetch(`/api/users?${params}`)
  const result: UsersResponse = await response.json()
  if (!response.ok) throw new Error((result as { error?: string }).error || 'Failed to fetch users')
  return result.data || []
}

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: queryKeys.usersList(filters),
    queryFn: () => fetchUsers(filters),
  })
}

export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to fetch user')
      return result.data as User
    },
    enabled: enabled && !!id,
  })
}
