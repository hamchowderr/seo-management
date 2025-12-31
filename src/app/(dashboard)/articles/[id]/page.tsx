'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  User,
  History,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Loader2,
  Edit2,
  MessageSquare,
  GitBranch,
  PenLine,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  STAGE_LABELS,
  STAGE_COLORS,
  getAllowedTransitions,
  type ArticleStage,
} from '@/lib/constants/stages'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { toast } from 'sonner'
import { createClient } from '@/lib/client'
import { AIGenerateDropdown } from '@/components/ai/ai-generate-dropdown'
import { ArticleComments } from '@/components/articles/article-comments'
import { RevisionTimeline } from '@/components/articles/revision-timeline'
import { ActivityTimeline } from '@/components/articles/activity-timeline'
import { ArticleEditor, type ArticleEditorRef } from '@/components/articles/article-editor'
import { queryKeys } from '@/hooks/queries'

interface ArticleAssignment {
  id: string
  user_id: string
  assigned_role: string
  is_active: boolean
  assigned_at: string
  users: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
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
    id: string
    full_name: string
    avatar_url?: string
  } | null
}

interface Article {
  id: string
  title: string
  full_title: string
  content: string | null
  content_type: 'seo' | 'blog'
  article_number: number
  month_year: string
  stage: ArticleStage
  word_count: number | null
  google_doc_id: string | null
  google_doc_url: string | null
  published_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  companies: {
    id: string
    name: string
    slug: string
  }
  keywords?: {
    id: string
    keyword_text: string
  }
  article_assignments: ArticleAssignment[]
  article_checklist: Array<{
    id: string
    checklist_item_id: string
    completed_at: string
    notes: string | null
    checklist_items: {
      id: string
      name: string
      description: string | null
    }
  }>
  article_history: HistoryItem[]
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const articleId = params.id as string

  const [movingTo, setMovingTo] = useState<string | null>(null)
  const [assigningRole, setAssigningRole] = useState<string | null>(null)

  // Edit states
  const [editingUrl, setEditingUrl] = useState<'google_doc' | 'published' | null>(null)
  const [urlValue, setUrlValue] = useState('')

  // Editor ref for AI content insertion
  const editorRef = useRef<ArticleEditorRef>(null)

  // Fetch article
  const {
    data: article,
    isLoading: loading,
    error: articleError,
  } = useQuery({
    queryKey: queryKeys.article(articleId),
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load article')
      return data.data as Article
    },
    retry: false,
  })

  // Handle article fetch error - redirect only if not found
  useEffect(() => {
    if (articleError && !loading) {
      toast.error(articleError instanceof Error ? articleError.message : 'Failed to load article')
      router.push('/articles')
    }
  }, [articleError, loading, router])

  // Fetch checklist
  const { data: checklist = [] } = useQuery({
    queryKey: queryKeys.articleChecklist(articleId),
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}/checklist`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      return (data.data || []) as ChecklistItem[]
    },
    enabled: !!articleId,
  })

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users', 'assignable'],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('role', ['writer', 'editor', 'poster', 'admin', 'project_manager'])
        .order('full_name')
      return (data || []) as User[]
    },
  })

  // Move article mutation
  const moveMutation = useMutation({
    mutationFn: async (toStage: ArticleStage) => {
      const response = await fetch(`/api/articles/${articleId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_stage: toStage }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.details)
      return { toStage }
    },
    onSuccess: ({ toStage }) => {
      toast.success(`Moved to ${STAGE_LABELS[toStage]}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.articles })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to move article')
    },
  })

  const handleMoveArticle = async (toStage: ArticleStage) => {
    if (!article) return
    setMovingTo(toStage)
    try {
      await moveMutation.mutateAsync(toStage)
    } finally {
      setMovingTo(null)
    }
  }

  // Checklist mutation with optimistic update
  const checklistMutation = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      if (completed) {
        const response = await fetch(
          `/api/articles/${articleId}/checklist?checklist_item_id=${itemId}`,
          { method: 'DELETE' }
        )
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error)
        }
      } else {
        const response = await fetch(`/api/articles/${articleId}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklist_item_id: itemId }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error)
        }
      }
    },
    onMutate: async ({ itemId, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.articleChecklist(articleId) })

      // Snapshot previous value
      const previousChecklist = queryClient.getQueryData<ChecklistItem[]>(
        queryKeys.articleChecklist(articleId)
      )

      // Optimistically update cache
      queryClient.setQueryData<ChecklistItem[]>(
        queryKeys.articleChecklist(articleId),
        (old) =>
          old?.map((item) =>
            item.id === itemId ? { ...item, completed: !completed, completion: null } : item
          )
      )

      return { previousChecklist }
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousChecklist) {
        queryClient.setQueryData(
          queryKeys.articleChecklist(articleId),
          context.previousChecklist
        )
      }
      toast.error(error instanceof Error ? error.message : 'Failed to update checklist')
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.articleChecklist(articleId) })
    },
  })

  const handleChecklistToggle = async (itemId: string, completed: boolean) => {
    if (!article) return
    checklistMutation.mutate({ itemId, completed })
  }

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/articles/${articleId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      return data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'User assigned')
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to assign user')
    },
  })

  const handleAssign = async (userId: string, role: string) => {
    setAssigningRole(role)
    try {
      await assignMutation.mutateAsync({ userId, role })
    } finally {
      setAssigningRole(null)
    }
  }

  // Update URL mutation
  const updateUrlMutation = useMutation({
    mutationFn: async ({
      field,
      value,
    }: {
      field: 'google_doc_url' | 'published_url'
      value: string | null
    }) => {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }
    },
    onSuccess: () => {
      toast.success('URL updated')
      setEditingUrl(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update URL')
    },
  })

  const handleUpdateUrl = async (field: 'google_doc_url' | 'published_url') => {
    updateUrlMutation.mutate({ field, value: urlValue || null })
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!article) {
    return null
  }

  const currentStage = article.stage
  const availableTransitions = getAllowedTransitions(currentStage)
  const contentTypeConfig = CONTENT_TYPES[article.content_type]
  const activeAssignments = article.article_assignments.filter((a) => a.is_active)

  const getAssignmentForRole = (role: string) =>
    activeAssignments.find((a) => a.assigned_role === role)

  const getUsersForRole = (role: string) =>
    users.filter((u) => u.role === role || u.role === 'admin' || u.role === 'project_manager')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" className="mt-1" asChild>
          <Link href="/articles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              style={{
                borderColor: contentTypeConfig.color,
                color: contentTypeConfig.color,
              }}
            >
              {contentTypeConfig.label}
            </Badge>
            {availableTransitions.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: `${STAGE_COLORS[currentStage]}20`,
                      color: STAGE_COLORS[currentStage],
                    }}
                  >
                    {STAGE_LABELS[currentStage]}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {availableTransitions.map((stage) => (
                    <DropdownMenuItem
                      key={stage}
                      onClick={() => handleMoveArticle(stage)}
                      disabled={!!movingTo}
                      className="cursor-pointer"
                    >
                      {movingTo === stage && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      <ChevronRight className="mr-2 h-3 w-3" />
                      Move to {STAGE_LABELS[stage]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${STAGE_COLORS[currentStage]}20`,
                  color: STAGE_COLORS[currentStage],
                }}
              >
                {STAGE_LABELS[currentStage]}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{article.full_title || article.title}</h1>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Company:</span>
          <span className="font-medium">{article.companies.name}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Month:</span>
          <span className="font-medium">{article.month_year}</span>
        </div>
        {article.keywords && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Keyword:</span>
              <span className="font-medium">{article.keywords.keyword_text}</span>
            </div>
          </>
        )}
        <Separator orientation="vertical" className="hidden h-4 sm:block" />
        <div className="text-muted-foreground hidden items-center gap-3 text-xs sm:flex">
          <span>#{article.article_number}</span>
          <span>Created {format(new Date(article.created_at), 'MMM d, yyyy')}</span>
          {article.word_count && <span>{article.word_count.toLocaleString()} words</span>}
        </div>

        {/* Team Avatars */}
        <div className="ml-auto flex items-center gap-3">
          <TooltipProvider>
            <div className="flex items-center gap-1">
              {['writer', 'editor', 'poster'].map((role) => {
                const assignment = getAssignmentForRole(role)
                const roleUsers = getUsersForRole(role)
                return (
                  <Popover key={role}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button className="focus:ring-ring rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none">
                            {assignment ? (
                              <Avatar className="hover:border-primary h-7 w-7 cursor-pointer border-2 border-transparent transition-colors">
                                <AvatarImage src={assignment.users.avatar_url} />
                                <AvatarFallback className="text-[10px]">
                                  {assignment.users.full_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-colors">
                                <span className="text-[10px] font-medium uppercase">{role[0]}</span>
                              </div>
                            )}
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p className="capitalize">
                          {role}: {assignment?.users.full_name || 'Unassigned'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <PopoverContent className="w-48 p-2" align="end">
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-xs capitalize">Assign {role}</p>
                        <Select
                          value={assignment?.user_id || ''}
                          onValueChange={(userId) => handleAssign(userId, role)}
                          disabled={assigningRole === role}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {roleUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id} className="text-xs">
                                {user.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </PopoverContent>
                  </Popover>
                )
              })}
            </div>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-4" />

          {/* Links */}
          {editingUrl === 'google_doc' ? (
            <div className="flex items-center gap-2">
              <Input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="Google Doc URL..."
                className="h-8 w-64 text-sm"
              />
              <Button size="sm" className="h-8" onClick={() => handleUpdateUrl('google_doc_url')}>
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingUrl(null)}>
                Cancel
              </Button>
            </div>
          ) : editingUrl === 'published' ? (
            <div className="flex items-center gap-2">
              <Input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="Published URL..."
                className="h-8 w-64 text-sm"
              />
              <Button size="sm" className="h-8" onClick={() => handleUpdateUrl('published_url')}>
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingUrl(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                {article.google_doc_url ? (
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <a href={article.google_doc_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-1 h-3 w-3" />
                      Doc
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-8"
                    onClick={() => {
                      setEditingUrl('google_doc')
                      setUrlValue('')
                    }}
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    Add Doc
                  </Button>
                )}
                {article.google_doc_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingUrl('google_doc')
                      setUrlValue(article.google_doc_url || '')
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {article.published_url ? (
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <a href={article.published_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Live
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-8"
                    onClick={() => {
                      setEditingUrl('published')
                      setUrlValue('')
                    }}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Add URL
                  </Button>
                )}
                {article.published_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingUrl('published')
                      setUrlValue(article.published_url || '')
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">
        <div>
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <PenLine className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              {article.google_doc_id && (
                <TabsTrigger value="revisions" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Revisions
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <ArticleEditor
                ref={editorRef}
                articleId={article.id}
                initialContent={article.content}
                onSave={() =>
                  queryClient.invalidateQueries({ queryKey: queryKeys.article(articleId) })
                }
                aiGenerateButton={
                  <AIGenerateDropdown
                    keyword={article.keywords?.keyword_text || article.title}
                    companyName={article.companies.name}
                    contentType={article.content_type}
                    onStream={(content) => {
                      editorRef.current?.streamContent(content)
                    }}
                    onInsert={(content, mode) => {
                      editorRef.current?.insertContent(content, mode)
                    }}
                  />
                }
              />
            </TabsContent>

            <TabsContent value="checklist" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Posting Checklist</CardTitle>
                  <CardDescription>Complete all items before publishing</CardDescription>
                </CardHeader>
                <CardContent>
                  {checklist.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No checklist items configured</p>
                  ) : (
                    <div className="space-y-3">
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
                              className={`text-sm font-medium ${
                                item.completed ? 'text-muted-foreground line-through' : ''
                              }`}
                            >
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {item.description}
                              </p>
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>Timeline of changes to this article</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline history={article.article_history} />
                </CardContent>
              </Card>
            </TabsContent>

            {article.google_doc_id && (
              <TabsContent value="revisions" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Google Doc Revisions</CardTitle>
                    <CardDescription>Version history from Google Docs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RevisionTimeline articleId={article.id} documentId={article.google_doc_id} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Comments Sidebar */}
        <div className="hidden xl:block">
          <div className="sticky top-6">
            <Card className="flex h-[calc(100vh-180px)] flex-col">
              <CardHeader className="flex-shrink-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden pt-0">
                <ArticleComments articleId={article.id} isAdmin={true} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
