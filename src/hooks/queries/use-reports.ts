'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys, type StatsFilters } from './keys'

interface ArticlesByMonth {
  month: string
  count: number
}

interface ArticlesByClient {
  client: string
  count: number
}

interface ArticlesByType {
  type: string
  count: number
}

interface AverageTimePerStage {
  stage: string
  avgDays: number
}

interface ArticlesByStage {
  stage: string
  count: number
}

export interface ReportsData {
  articlesByMonth: ArticlesByMonth[]
  articlesByClient: ArticlesByClient[]
  articlesByType: ArticlesByType[]
  averageTimePerStage: AverageTimePerStage[]
  articlesByStage: ArticlesByStage[]
  overview: {
    totalArticles: number
    publishedThisMonth: number
    totalCompanies: number
    totalKeywords: number
    usedKeywords: number
  }
}

async function fetchReports(filters?: StatsFilters): Promise<ReportsData> {
  const params = new URLSearchParams()
  if (filters?.companyId) {
    params.set('company_id', filters.companyId)
  }

  const url = `/api/reports${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch reports')
  }

  const result = await response.json()
  return result.data
}

export function useReports(filters?: StatsFilters) {
  return useQuery({
    queryKey: queryKeys.reports(filters),
    queryFn: () => fetchReports(filters),
    staleTime: 60 * 1000, // 1 minute
  })
}
