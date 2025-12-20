import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, type BoardFilters } from './keys'
import { WORKFLOW_STAGES, type ArticleStage } from '@/lib/constants/stages'
import type { BoardArticle, BoardState } from '@/types/board'

async function fetchBoardArticles(filters: BoardFilters): Promise<BoardArticle[]> {
  const params = new URLSearchParams()
  if (filters.companyId) params.set('company_id', filters.companyId)
  if (filters.monthYear) params.set('month_year', filters.monthYear)
  if (filters.contentType) params.set('content_type', filters.contentType)

  const response = await fetch(`/api/board?${params}`)
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Failed to fetch board articles')
  return result.data || []
}

export function useBoardArticles(filters: BoardFilters = {}) {
  return useQuery({
    queryKey: queryKeys.boardArticles(filters),
    queryFn: () => fetchBoardArticles(filters),
    refetchInterval: 30000, // 30s polling
  })
}

export function useBoard(filters: BoardFilters = {}) {
  const query = useBoardArticles(filters)

  const columns = useMemo((): BoardState['columns'] => {
    const cols = {} as BoardState['columns']
    WORKFLOW_STAGES.forEach((stage) => {
      cols[stage] = (query.data || []).filter((article) => article.stage === stage)
    })
    return cols
  }, [query.data])

  return {
    ...query,
    articles: query.data || [],
    columns,
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  }
}

export function useMoveArticle(filters: BoardFilters = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, toStage }: { articleId: string; toStage: ArticleStage }) => {
      const response = await fetch(`/api/articles/${articleId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_stage: toStage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to move article')
      }

      return data
    },
    onMutate: async ({ articleId, toStage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.boardArticles(filters) })

      // Snapshot previous value
      const previousArticles = queryClient.getQueryData<BoardArticle[]>(
        queryKeys.boardArticles(filters)
      )

      // Optimistically update
      queryClient.setQueryData<BoardArticle[]>(queryKeys.boardArticles(filters), (old) =>
        old?.map((article) => (article.id === articleId ? { ...article, stage: toStage } : article))
      )

      return { previousArticles }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousArticles) {
        queryClient.setQueryData(queryKeys.boardArticles(filters), context.previousArticles)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.boardArticles(filters) })
    },
  })
}

// Helper hook that combines useBoard with useMoveArticle for backward compatibility
export function useBoardWithMove(filters: BoardFilters = {}) {
  const board = useBoard(filters)
  const moveMutation = useMoveArticle(filters)

  const moveArticle = async (
    articleId: string,
    toStage: ArticleStage
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await moveMutation.mutateAsync({ articleId, toStage })
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to move article',
      }
    }
  }

  return {
    ...board,
    moveArticle,
  }
}
