'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { WORKFLOW_STAGES, type ArticleStage } from '@/lib/constants/stages'
import type { BoardArticle, BoardState } from '@/types/board'

interface UseBoardOptions {
  companyId?: string
  monthYear?: string
  contentType?: string
}

export function useBoard(options: UseBoardOptions = {}) {
  const [articles, setArticles] = useState<BoardArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialLoad = useRef(true)

  const fetchArticles = useCallback(async () => {
    // Only show loading state on initial load, not during polling
    if (isInitialLoad.current) {
      setLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.companyId) params.set('company_id', options.companyId)
      if (options.monthYear) params.set('month_year', options.monthYear)
      if (options.contentType) params.set('content_type', options.contentType)

      const response = await fetch(`/api/board?${params}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error)
      setArticles(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles')
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [options.companyId, options.monthYear, options.contentType])

  useEffect(() => {
    isInitialLoad.current = true
    fetchArticles()
  }, [fetchArticles])

  // Polling for updates (simpler than realtime for now)
  useEffect(() => {
    const interval = setInterval(fetchArticles, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [fetchArticles])

  const getColumnArticles = useCallback((): BoardState['columns'] => {
    const columns: BoardState['columns'] = {} as BoardState['columns']

    WORKFLOW_STAGES.forEach((stage) => {
      columns[stage] = articles.filter((article) => article.stage === stage)
    })

    return columns
  }, [articles])

  const moveArticle = async (
    articleId: string,
    toStage: ArticleStage
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/articles/${articleId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_stage: toStage }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || data.details }
      }

      // Optimistic update
      setArticles((prev) =>
        prev.map((article) => (article.id === articleId ? { ...article, stage: toStage } : article))
      )

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to move article',
      }
    }
  }

  return {
    articles,
    columns: getColumnArticles(),
    loading,
    error,
    refetch: fetchArticles,
    moveArticle,
  }
}
