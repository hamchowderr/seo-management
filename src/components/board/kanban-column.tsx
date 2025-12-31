'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { KanbanCard } from './kanban-card'
import { STAGE_LABELS, STAGE_COLORS, type ArticleStage } from '@/lib/constants/stages'
import type { BoardArticle } from '@/types/board'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  stage: ArticleStage
  articles: BoardArticle[]
  onCardClick?: (article: BoardArticle) => void
}

export function KanbanColumn({ stage, articles, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  const stageColor = STAGE_COLORS[stage]
  const stageLabel = STAGE_LABELS[stage]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-w-0 flex-1 flex-col md:min-w-[180px] rounded-lg transition-all duration-200',
        isOver && 'bg-primary/10 ring-primary ring-2 ring-inset'
      )}
    >
      <div className="bg-background/50 flex items-center justify-between border-b p-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: stageColor }}
          />
          <h3 className="truncate text-xs font-semibold">{stageLabel}</h3>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {articles.length}
        </Badge>
      </div>
      <div
        className="flex-1 overflow-hidden rounded-b-lg"
      >
        <ScrollArea className="h-full">
          <SortableContext items={articles.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 p-2">
              {isOver && <div className="bg-primary h-1 animate-pulse rounded-full" />}
              {articles.length === 0 ? (
                <div
                  className={cn(
                    'text-muted-foreground flex h-20 items-center justify-center rounded-lg border-2 border-dashed text-xs',
                    isOver && 'border-primary bg-primary/5'
                  )}
                >
                  Drop here
                </div>
              ) : (
                articles.map((article) => (
                  <KanbanCard
                    key={article.id}
                    article={article}
                    onClick={() => onCardClick?.(article)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  )
}
