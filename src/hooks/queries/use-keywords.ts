import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, type KeywordFilters } from './keys'

export interface Keyword {
  id: string
  keyword_text: string
  company_id: string
  content_type: string
  month_year: string
  status: string
  search_volume: number | null
  difficulty_score: number | null
  notes: string | null
  created_at: string
  companies?: {
    id: string
    name: string
    slug: string
  }
  articles?: {
    id: string
    title: string
    stage: string
  }[]
}

interface KeywordsResponse {
  data: Keyword[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchKeywords(filters: KeywordFilters): Promise<Keyword[]> {
  const params = new URLSearchParams()
  if (filters.companyId && filters.companyId !== 'all') params.set('company_id', filters.companyId)
  if (filters.contentType && filters.contentType !== 'all')
    params.set('content_type', filters.contentType)
  if (filters.monthYear && filters.monthYear !== 'all') params.set('month_year', filters.monthYear)

  const response = await fetch(`/api/keywords?${params}`)
  const result: KeywordsResponse = await response.json()
  if (!response.ok)
    throw new Error((result as { error?: string }).error || 'Failed to fetch keywords')
  return result.data || []
}

export function useKeywords(filters: KeywordFilters = {}, options?: { polling?: boolean }) {
  return useQuery({
    queryKey: queryKeys.keywordsList(filters),
    queryFn: () => fetchKeywords(filters),
    refetchInterval: options?.polling ? 30000 : false,
  })
}

export function useKeyword(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.keyword(id),
    queryFn: async () => {
      const response = await fetch(`/api/keywords/${id}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to fetch keyword')
      return result.data as Keyword
    },
    enabled: enabled && !!id,
  })
}

interface CreateKeywordData {
  keyword_text: string
  company_id: string
  content_type: string
  month_year: string
  search_volume?: number | null
  difficulty_score?: number | null
  notes?: string | null
}

export function useCreateKeyword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateKeywordData) => {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create keyword')
      return result.data as Keyword
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords })
    },
  })
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete keyword')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keywords })
    },
  })
}
