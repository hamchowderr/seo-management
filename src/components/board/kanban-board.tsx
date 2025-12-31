'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Loader2 } from 'lucide-react'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { ArticleDetailModal } from './article-detail-modal'
import { useBoard } from '@/hooks/use-board'
import {
  WORKFLOW_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  type ArticleStage,
} from '@/lib/constants/stages'
import type { BoardArticle } from '@/types/board'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface KanbanBoardProps {
  companyId?: string
  monthYear?: string
  contentType?: string
}

export function KanbanBoard({ companyId, monthYear, contentType }: KanbanBoardProps) {
  const { columns, loading, error, moveArticle, refetch } = useBoard({
    companyId,
    monthYear,
    contentType,
  })
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const [activeArticle, setActiveArticle] = useState<BoardArticle | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<BoardArticle | null>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const articleId = active.id as string

      // Find the article in all columns
      for (const stage of WORKFLOW_STAGES) {
        const article = columns[stage].find((a) => a.id === articleId)
        if (article) {
          setActiveArticle(article)
          break
        }
      }
    },
    [columns]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      setActiveArticle(null)

      if (!over) return

      const articleId = active.id as string

      // Validate articleId is a UUID format (permissive - just checks 8-4-4-4-12 hex pattern)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(articleId)) {
        console.error('Invalid article ID:', articleId)
        return
      }

      // Determine target stage - over.id could be a stage name OR a card UUID
      let targetStage: ArticleStage | null = null

      if (WORKFLOW_STAGES.includes(over.id as ArticleStage)) {
        // Dropped on a column drop zone
        targetStage = over.id as ArticleStage
      } else {
        // Dropped on a card - find which column that card belongs to
        for (const stage of WORKFLOW_STAGES) {
          if (columns[stage].find((a) => a.id === over.id)) {
            targetStage = stage
            break
          }
        }
      }

      if (!targetStage) return

      // Find the article's current stage
      let currentStage: ArticleStage | null = null
      for (const stage of WORKFLOW_STAGES) {
        if (columns[stage].find((a) => a.id === articleId)) {
          currentStage = stage
          break
        }
      }

      if (!currentStage || currentStage === targetStage) return

      // Attempt to move the article
      const result = await moveArticle(articleId, targetStage)

      if (!result.success) {
        toast({
          title: 'Cannot move article',
          description: result.error,
          variant: 'destructive',
        })
        // Refetch to reset any optimistic updates
        refetch()
      } else {
        toast({
          title: 'Article moved',
          description: `Article moved to ${targetStage.replace(/_/g, ' ')}`,
        })
      }
    },
    [columns, moveArticle, toast, refetch]
  )

  const handleCardClick = useCallback((article: BoardArticle) => {
    setSelectedArticle(article)
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <p className="text-destructive mb-2">Failed to load board</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    )
  }

  // Mobile view: Tab-based navigation showing one stage at a time
  if (isMobile) {
    const activeStage = WORKFLOW_STAGES[activeStageIndex]

    return (
      <>
        <div className="flex h-full flex-col">
          {/* Mobile tab navigation */}
          <ScrollArea className="bg-background/50 w-full border-b">
            <div className="flex gap-1 p-2">
              {WORKFLOW_STAGES.map((stage, index) => {
                const stageColor = STAGE_COLORS[stage]
                const isActive = index === activeStageIndex
                const count = columns[stage].length

                return (
                  <button
                    key={stage}
                    onClick={() => setActiveStageIndex(index)}
                    className={cn(
                      'flex min-h-[44px] items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: isActive ? 'currentColor' : stageColor }}
                    />
                    <span className="hidden sm:inline">{STAGE_LABELS[stage]}</span>
                    <span className="sm:hidden">{STAGE_LABELS[stage].split(' ')[0]}</span>
                    <span
                      className={cn(
                        'ml-1 rounded-full px-1.5 py-0.5 text-xs',
                        isActive ? 'bg-primary-foreground/20' : 'bg-background'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Single column content - no drag and drop on mobile */}
          <div className="flex-1 overflow-hidden">
            <KanbanColumn
              stage={activeStage}
              articles={columns[activeStage]}
              onCardClick={handleCardClick}
            />
          </div>
        </div>

        <ArticleDetailModal
          article={selectedArticle}
          open={!!selectedArticle}
          onOpenChange={(open) => {
            if (!open) setSelectedArticle(null)
          }}
          onUpdate={refetch}
        />
      </>
    )
  }

  // Desktop/Tablet view: Horizontal scrolling columns with drag and drop
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-2 overflow-x-auto p-2">
          {WORKFLOW_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              articles={columns[stage]}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeArticle && <KanbanCard article={activeArticle} isDragging />}
        </DragOverlay>
      </DndContext>

      <ArticleDetailModal
        article={selectedArticle}
        open={!!selectedArticle}
        onOpenChange={(open) => {
          if (!open) setSelectedArticle(null)
        }}
        onUpdate={refetch}
      />
    </>
  )
}
