import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys, type ArticleFilters } from './keys'

export interface Article {
  id: string
  title: string
  full_title: string
  stage: string
  content_type: string
  month_year: string
  article_number: number
  company_id: string
  keyword_id: string | null
  google_doc_url: string | null
  word_count: number | null
  meta_title: string | null
  meta_description: string | null
  notes: string | null
  published_url: string | null
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  companies?: {
    id: string
    name: string
    slug: string
  }
  keywords?: {
    id: string
    keyword_text: string
  }
  article_assignments?: {
    id: string
    user_id: string
    assigned_role: string
    is_active: boolean
    users?: {
      id: string
      full_name: string
      email: string
    }
  }[]
}

interface ArticlesResponse {
  data: Article[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchArticles(filters: ArticleFilters): Promise<ArticlesResponse> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.limit) params.set('limit', filters.limit.toString())
  if (filters.companyId && filters.companyId !== 'all') params.set('company_id', filters.companyId)
  if (filters.stage && filters.stage !== 'all') params.set('stage', filters.stage)
  if (filters.contentType && filters.contentType !== 'all')
    params.set('content_type', filters.contentType)
  if (filters.monthYear && filters.monthYear !== 'all') params.set('month_year', filters.monthYear)
  if (filters.assignedTo) params.set('assigned_to', filters.assignedTo)

  const response = await fetch(`/api/articles?${params}`)
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Failed to fetch articles')
  return result
}

export function useArticles(filters: ArticleFilters = {}, options?: { polling?: boolean }) {
  return useQuery({
    queryKey: queryKeys.articlesList(filters),
    queryFn: () => fetchArticles(filters),
    placeholderData: keepPreviousData,
    refetchInterval: options?.polling ? 30000 : false,
  })
}

export function useArticle(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.article(id),
    queryFn: async () => {
      const response = await fetch(`/api/articles/${id}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to fetch article')
      return result.data as Article
    },
    enabled: enabled && !!id,
  })
}

export interface ChecklistItem {
  id: string
  name: string
  description: string | null
  order_index: number
  is_required: boolean
  completed?: boolean
}

export function useArticleChecklist(articleId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.articleChecklist(articleId),
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}/checklist`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to fetch checklist')
      return (result.data || []) as ChecklistItem[]
    },
    enabled: enabled && !!articleId,
  })
}

export interface Comment {
  id: string
  article_id: string
  user_id: string
  content: string
  created_at: string
  users?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export function useArticleComments(articleId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.articleComments(articleId),
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}/comments`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to fetch comments')
      return (result.data || []) as Comment[]
    },
    enabled: enabled && !!articleId,
  })
}

export interface HistoryEntry {
  id: string
  article_id: string
  user_id: string | null
  action: string
  from_stage: string | null
  to_stage: string | null
  details: Record<string, unknown> | null
  created_at: string
  users?: {
    id: string
    full_name: string
    email: string
  }
}

export function useArticleHistory(articleId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.articleHistory(articleId),
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to fetch article history')
      return (result.data?.history || []) as HistoryEntry[]
    },
    enabled: enabled && !!articleId,
  })
}

export function useUpdateChecklist(articleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      if (completed) {
        const response = await fetch(
          `/api/articles/${articleId}/checklist?checklist_item_id=${itemId}`,
          {
            method: 'DELETE',
          }
        )
        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to update checklist')
        }
      } else {
        const response = await fetch(`/api/articles/${articleId}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklist_item_id: itemId }),
        })
        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to update checklist')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articleChecklist(articleId) })
    },
  })
}

export function useAddComment(articleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to add comment')
      return result.data as Comment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articleComments(articleId) })
    },
  })
}
