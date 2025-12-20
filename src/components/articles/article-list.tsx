'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { MoreHorizontal, ExternalLink, FileText, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { STAGE_LABELS, STAGE_COLORS, type ArticleStage } from '@/lib/constants/stages'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'

interface ArticleAssignment {
  id: string
  user_id: string
  assigned_role: string
  is_active: boolean
  users: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

interface Article {
  id: string
  title: string
  full_title: string
  content_type: 'seo' | 'blog'
  article_number: number
  month_year: string
  stage: ArticleStage
  word_count: number | null
  google_doc_url: string | null
  published_url: string | null
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
}

interface ArticleListProps {
  articles: Article[]
  onRefresh?: () => void
}

export function ArticleList({ articles, onRefresh }: ArticleListProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (article: Article) => {
    if (article.stage === 'published') {
      toast({
        title: 'Cannot delete',
        description: 'Cannot delete a published article',
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Are you sure you want to delete "${article.title}"?`)) {
      return
    }

    setDeletingId(article.id)
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      toast({
        title: 'Article deleted',
        description: `"${article.title}" has been deleted`,
      })
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete article',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-muted-foreground">
          No articles found. Create one from the Keyword Hopper or add directly.
        </p>
      </div>
    )
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {articles.map((article) => {
          const activeAssignments = article.article_assignments.filter((a) => a.is_active)
          const contentTypeConfig = CONTENT_TYPES[article.content_type]

          return (
            <Card key={article.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/articles/${article.id}`}
                    className="line-clamp-2 font-medium hover:underline"
                  >
                    {article.full_title || article.title}
                  </Link>
                  {article.keywords && (
                    <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                      {article.keywords.keyword_text}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {article.companies.name}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: contentTypeConfig.color,
                        color: contentTypeConfig.color,
                      }}
                    >
                      {contentTypeConfig.label}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${STAGE_COLORS[article.stage]}20`,
                        color: STAGE_COLORS[article.stage],
                      }}
                    >
                      {STAGE_LABELS[article.stage]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {activeAssignments.length > 0 && (
                      <div className="flex -space-x-1">
                        {activeAssignments.slice(0, 3).map((assignment) => (
                          <Avatar key={assignment.id} className="border-background h-5 w-5 border">
                            <AvatarImage
                              src={assignment.users.avatar_url}
                              alt={assignment.users.full_name}
                            />
                            <AvatarFallback className="text-[10px]">
                              {assignment.users.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {activeAssignments.length > 3 && (
                          <Avatar className="border-background h-5 w-5 border">
                            <AvatarFallback className="text-[10px]">
                              +{activeAssignments.length - 3}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(article.updated_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/articles/${article.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {article.google_doc_url && (
                      <DropdownMenuItem asChild>
                        <a href={article.google_doc_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="mr-2 h-4 w-4" />
                          Open Google Doc
                        </a>
                      </DropdownMenuItem>
                    )}
                    {article.published_url && (
                      <DropdownMenuItem asChild>
                        <a href={article.published_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Published
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(article)}
                      disabled={article.stage === 'published' || deletingId === article.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  // Desktop table view
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {articles.map((article) => {
          const activeAssignments = article.article_assignments.filter((a) => a.is_active)
          const contentTypeConfig = CONTENT_TYPES[article.content_type]

          return (
            <TableRow key={article.id}>
              <TableCell>
                <div>
                  <Link href={`/articles/${article.id}`} className="font-medium hover:underline">
                    {article.full_title || article.title}
                  </Link>
                  {article.keywords && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {article.keywords.keyword_text}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{article.companies.name}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: contentTypeConfig.color,
                    color: contentTypeConfig.color,
                  }}
                >
                  {contentTypeConfig.label}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${STAGE_COLORS[article.stage]}20`,
                    color: STAGE_COLORS[article.stage],
                  }}
                >
                  {STAGE_LABELS[article.stage]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                  <TooltipProvider>
                    {activeAssignments.slice(0, 3).map((assignment) => (
                      <Tooltip key={assignment.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="border-background h-6 w-6 border-2">
                            <AvatarImage
                              src={assignment.users.avatar_url}
                              alt={assignment.users.full_name}
                            />
                            <AvatarFallback className="text-xs">
                              {assignment.users.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {assignment.users.full_name} ({assignment.assigned_role})
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {activeAssignments.length > 3 && (
                      <Avatar className="border-background h-6 w-6 border-2">
                        <AvatarFallback className="text-xs">
                          +{activeAssignments.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </TooltipProvider>
                  {activeAssignments.length === 0 && (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(article.updated_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/articles/${article.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {article.google_doc_url && (
                      <DropdownMenuItem asChild>
                        <a href={article.google_doc_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="mr-2 h-4 w-4" />
                          Open Google Doc
                        </a>
                      </DropdownMenuItem>
                    )}
                    {article.published_url && (
                      <DropdownMenuItem asChild>
                        <a href={article.published_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Published
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(article)}
                      disabled={article.stage === 'published' || deletingId === article.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
