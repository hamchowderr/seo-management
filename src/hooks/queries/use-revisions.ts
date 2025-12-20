'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from './keys'

interface DocRevision {
  id: string
  modifiedTime: string
  lastModifyingUser?: {
    displayName?: string
    emailAddress?: string
    photoLink?: string
  }
}

interface RevisionsResponse {
  data: DocRevision[]
  documentId: string
}

async function fetchRevisions(articleId: string): Promise<RevisionsResponse> {
  const response = await fetch(`/api/articles/${articleId}/revisions`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch revisions')
  }

  return response.json()
}

export function useArticleRevisions(articleId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.articleRevisions(articleId),
    queryFn: () => fetchRevisions(articleId),
    enabled: enabled && !!articleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}
