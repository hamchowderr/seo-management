import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './keys'

export interface Company {
  id: string
  name: string
  slug: string
  website_url: string | null
  blog_quota: number
  seo_quota: number
  is_active: boolean
  created_at: string
}

interface CompaniesResponse {
  data: Company[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchCompanies(): Promise<Company[]> {
  const response = await fetch('/api/companies')
  const result: CompaniesResponse = await response.json()
  if (!response.ok)
    throw new Error((result as { error?: string }).error || 'Failed to fetch companies')
  return result.data || []
}

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies,
    queryFn: fetchCompanies,
    staleTime: 5 * 60 * 1000, // Companies rarely change, 5 min stale time
  })
}

interface CreateCompanyData {
  name: string
  slug?: string
  website_url?: string | null
  blog_quota?: number
  seo_quota?: number
}

interface UpdateCompanyData extends Partial<CreateCompanyData> {
  id: string
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create company')
      return result.data as Company
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies })
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateCompanyData) => {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to update company')
      return result.data as Company
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies })
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete company')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies })
    },
  })
}
