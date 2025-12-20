'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { Clock, ExternalLink, RefreshCw, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useArticleRevisions } from '@/hooks/queries/use-revisions'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/queries'

interface RevisionTimelineProps {
  articleId: string
  documentId?: string | null
}

export function RevisionTimeline({ articleId, documentId }: RevisionTimelineProps) {
  const queryClient = useQueryClient()
  const { data, isLoading, error, isFetching } = useArticleRevisions(articleId, !!documentId)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.articleRevisions(articleId) })
  }

  if (!documentId) {
    return (
      <p className="text-muted-foreground text-sm">
        No Google Doc linked to this article yet. Revisions will appear here once a document is
        created.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm">
        <p className="text-destructive mb-2">
          {error instanceof Error ? error.message : 'Failed to load revisions'}
        </p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  const revisions = data?.data || []

  if (revisions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No revisions found yet. Revisions appear after the document is edited.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {revisions.length} revision{revisions.length === 1 ? '' : 's'} found
        </p>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="bg-border absolute top-0 left-4 h-full w-px" />

        {revisions.map((revision, index) => {
          const modifiedDate = new Date(revision.modifiedTime)
          const user = revision.lastModifyingUser
          const initials =
            user?.displayName
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || '?'

          return (
            <div key={revision.id} className="relative flex items-start gap-4 pb-6">
              {/* Avatar on the timeline */}
              <Avatar className="bg-background relative z-10 h-8 w-8 border-2">
                <AvatarImage src={user?.photoLink} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {user?.displayName || user?.emailAddress || 'Unknown user'}
                  </span>
                  {index === 0 && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                      Latest
                    </span>
                  )}
                </div>

                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(modifiedDate, { addSuffix: true })}
                  </span>
                  <span className="hidden sm:inline">-</span>
                  <span className="hidden sm:inline">
                    {format(modifiedDate, 'MMM d, yyyy h:mm a')}
                  </span>
                </div>

                {user?.emailAddress && (
                  <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                    <User className="h-3 w-3" />
                    {user.emailAddress}
                  </p>
                )}

                {/* Link to view this revision */}
                <a
                  href={`https://docs.google.com/document/d/${documentId}/revisions/r/${revision.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-2 inline-flex items-center gap-1 text-xs hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View this revision
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
