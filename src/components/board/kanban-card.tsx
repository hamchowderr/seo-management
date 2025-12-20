'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, FileText, ExternalLink, User, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import type { BoardArticle } from '@/types/board'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  article: BoardArticle
  onClick?: () => void
  isDragging?: boolean
}

export function KanbanCard({ article, onClick, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: article.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const activeAssignments = article.article_assignments.filter((a) => a.is_active)

  const contentTypeConfig = CONTENT_TYPES[article.content_type]

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'hover:border-primary/50 cursor-pointer transition-all hover:shadow-md',
        (isDragging || isSortableDragging) &&
          'border-primary scale-105 rotate-1 opacity-60 shadow-xl'
      )}
      onClick={onClick}
    >
      <CardContent className="p-2">
        <div className="flex items-start gap-2">
          <button
            className="text-muted-foreground hover:text-foreground mt-1 cursor-grab touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="shrink-0 text-xs"
                style={{
                  borderColor: contentTypeConfig.color,
                  color: contentTypeConfig.color,
                }}
              >
                {contentTypeConfig.label}
              </Badge>
              <span className="text-muted-foreground text-xs">#{article.article_number}</span>
            </div>
            <h4 className="mb-1 line-clamp-2 text-sm font-medium">{article.title}</h4>
            <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
              <span className="text-foreground font-medium">{article.companies.name}</span>
              <span>•</span>
              <span>{article.month_year}</span>
            </div>
            {article.keywords && (
              <p className="text-muted-foreground mb-2 line-clamp-1 text-xs">
                {article.keywords.keyword_text}
              </p>
            )}
            <div className="flex items-center justify-between">
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="border-background h-6 w-6 border-2">
                          <AvatarFallback className="text-xs">
                            +{activeAssignments.length - 3}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{activeAssignments.length - 3} more assigned</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
                {activeAssignments.length === 0 && (
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <User className="h-3 w-3" />
                    Unassigned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {article.google_doc_url && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={article.google_doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open Google Doc</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {article.published_url && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={article.published_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View published article</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/articles/${article.id}`}
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit article</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
