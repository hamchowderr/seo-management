'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  FileText,
  ExternalLink,
  Calendar,
  Building2,
  User,
  History,
  CheckSquare,
  ChevronRight,
  Loader2,
  MessageSquare,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  STAGE_LABELS,
  STAGE_COLORS,
  getAllowedTransitions,
  type ArticleStage,
} from '@/lib/constants/stages'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { useToast } from '@/hooks/use-toast'
import { ArticleComments } from '@/components/articles/article-comments'
import type { BoardArticle } from '@/types/board'

interface ArticleDetailModalProps {
  article: BoardArticle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

interface ChecklistItem {
  id: string
  name: string
  description: string | null
  completed: boolean
  completion: {
    completed_at: string
    notes: string | null
    completed_by_user: {
      full_name: string
    }
  } | null
}

interface HistoryItem {
  id: string
  action: string
  from_stage: string | null
  to_stage: string | null
  details: Record<string, unknown> | null
  created_at: string
  users: {
    full_name: string
  }
}

export function ArticleDetailModal({
  article,
  open,
  onOpenChange,
  onUpdate,
}: ArticleDetailModalProps) {
  const { toast } = useToast()
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [movingTo, setMovingTo] = useState<string | null>(null)

  const fetchChecklist = useCallback(async (articleId: string) => {
    setLoadingChecklist(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/checklist`)
      const data = await response.json()
      if (response.ok) {
        setChecklist(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch checklist:', error)
    } finally {
      setLoadingChecklist(false)
    }
  }, [])

  const fetchHistory = useCallback(async (articleId: string) => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/articles/${articleId}`)
      const data = await response.json()
      if (response.ok) {
        setHistory(data.data?.article_history || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (article?.id && open) {
      fetchChecklist(article.id)
      fetchHistory(article.id)
    }
  }, [article?.id, open, fetchChecklist, fetchHistory])

  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    if (!article) return

    try {
      if (completed) {
        // Uncomplete
        const response = await fetch(
          `/api/articles/${article.id}/checklist?checklist_item_id=${itemId}`,
          { method: 'DELETE' }
        )
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error)
        }
      } else {
        // Complete
        const response = await fetch(`/api/articles/${article.id}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklist_item_id: itemId }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error)
        }
      }
      fetchChecklist(article.id)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update checklist',
        variant: 'destructive',
      })
    }
  }

  const handleMoveArticle = async (toStage: ArticleStage) => {
    if (!article) return
    setMovingTo(toStage)

    try {
      const response = await fetch(`/api/articles/${article.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_stage: toStage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details)
      }

      toast({
        title: 'Article moved',
        description: `Moved to ${STAGE_LABELS[toStage]}`,
      })

      onUpdate?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Cannot move article',
        description: error instanceof Error ? error.message : 'Failed to move article',
        variant: 'destructive',
      })
    } finally {
      setMovingTo(null)
    }
  }

  if (!article) return null

  const currentStage = article.stage as ArticleStage
  const availableTransitions = getAllowedTransitions(currentStage)
  const contentTypeConfig = CONTENT_TYPES[article.content_type]
  const activeAssignments = article.article_assignments.filter((a) => a.is_active)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  style={{
                    borderColor: contentTypeConfig.color,
                    color: contentTypeConfig.color,
                  }}
                >
                  {contentTypeConfig.label}
                </Badge>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${STAGE_COLORS[currentStage]}20`,
                    color: STAGE_COLORS[currentStage],
                  }}
                >
                  {STAGE_LABELS[currentStage]}
                </Badge>
              </div>
              <DialogTitle className="text-lg">{article.full_title || article.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="mr-1 h-4 w-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{article.companies.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Month:</span>
                  <span className="font-medium">{article.month_year}</span>
                </div>
              </div>

              {article.keywords && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Keyword:</span>{' '}
                  <span className="font-medium">{article.keywords.keyword_text}</span>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Assignments
                </h4>
                {activeAssignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No active assignments</p>
                ) : (
                  <div className="space-y-2">
                    {activeAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={assignment.users.avatar_url} />
                          <AvatarFallback>
                            {assignment.users.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{assignment.users.full_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {assignment.assigned_role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Links</h4>
                <div className="flex gap-2">
                  {article.google_doc_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.google_doc_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Google Doc
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <FileText className="mr-2 h-4 w-4" />
                      No Doc
                    </Button>
                  )}
                  {article.published_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.published_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Published
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Not Published
                    </Button>
                  )}
                  <Button variant="default" size="sm" asChild>
                    <Link href={`/articles/${article.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Article
                    </Link>
                  </Button>
                </div>
              </div>

              {availableTransitions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Move to</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableTransitions.map((stage) => (
                        <Button
                          key={stage}
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveArticle(stage)}
                          disabled={!!movingTo}
                        >
                          {movingTo === stage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <ChevronRight className="mr-1 h-4 w-4" />
                          {STAGE_LABELS[stage]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="mt-4">
              <div className="space-y-2">
                <div className="mb-4 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Posting Checklist</h4>
                </div>
                {loadingChecklist ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                  </div>
                ) : checklist.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No checklist items</p>
                ) : (
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="bg-card flex items-start gap-3 rounded-lg border p-3"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleChecklistToggle(item.id, item.completed)}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                          disabled={currentStage !== 'assigned_for_posting'}
                        />
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${item.completed ? 'text-muted-foreground line-through' : ''}`}
                          >
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
                          )}
                          {item.completion && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              Completed by {item.completion.completed_by_user.full_name} on{' '}
                              {format(new Date(item.completion.completed_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <ArticleComments articleId={article.id} isAdmin={true} />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-2">
                <div className="mb-4 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <h4 className="text-sm font-medium">History</h4>
                </div>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No history</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 text-sm">
                        <div className="bg-muted-foreground mt-2 h-2 w-2 rounded-full" />
                        <div className="flex-1">
                          <p>
                            <span className="font-medium">{item.users?.full_name || 'System'}</span>{' '}
                            {item.action === 'stage_change' ? (
                              <>
                                moved from{' '}
                                <Badge variant="outline" className="text-xs">
                                  {STAGE_LABELS[item.from_stage as ArticleStage] || item.from_stage}
                                </Badge>{' '}
                                to{' '}
                                <Badge variant="outline" className="text-xs">
                                  {STAGE_LABELS[item.to_stage as ArticleStage] || item.to_stage}
                                </Badge>
                              </>
                            ) : item.action === 'assignment' ? (
                              <>
                                assigned{' '}
                                {
                                  (item.details as { assigned_user_name?: string })
                                    ?.assigned_user_name
                                }
                              </>
                            ) : (
                              <>{item.action}</>
                            )}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
