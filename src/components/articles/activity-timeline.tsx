'use client'

import { formatDistanceToNow, format } from 'date-fns'
import {
  ArrowRight,
  FileText,
  UserPlus,
  CheckCircle,
  Clock,
  MessageSquare,
  Edit,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { STAGE_LABELS, type ArticleStage } from '@/lib/constants/stages'

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

interface ActivityTimelineProps {
  history: HistoryItem[]
}

const actionIcons: Record<string, React.ElementType> = {
  created: FileText,
  stage_change: ArrowRight,
  assignment: UserPlus,
  checklist_completed: CheckCircle,
  comment: MessageSquare,
  edit: Edit,
}

const actionColors: Record<string, string> = {
  created: 'bg-blue-500',
  stage_change: 'bg-purple-500',
  assignment: 'bg-green-500',
  checklist_completed: 'bg-emerald-500',
  comment: 'bg-amber-500',
  edit: 'bg-gray-500',
}

export function ActivityTimeline({ history }: ActivityTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">No activity history yet.</p>
    )
  }

  // Sort by newest first
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="bg-border absolute top-2 left-5 h-[calc(100%-16px)] w-px" />

      {sortedHistory.map((item) => {
        const Icon = actionIcons[item.action] || Clock
        const colorClass = actionColors[item.action] || 'bg-gray-500'
        const user = item.users
        const initials =
          user?.full_name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase() || '?'

        const createdDate = new Date(item.created_at)
        const timeAgo = formatDistanceToNow(createdDate, { addSuffix: true })
        const fullDate = format(createdDate, 'MMM d, yyyy h:mm a')

        return (
          <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Icon on timeline */}
            <div
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass} text-white`}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {user && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-sm font-medium">{user?.full_name || 'System'}</span>
                </div>
                <span className="text-muted-foreground text-xs" title={fullDate}>
                  {timeAgo}
                </span>
              </div>

              <div className="mt-1">
                {item.action === 'stage_change' && item.from_stage && item.to_stage ? (
                  <p className="text-sm">
                    Moved article from{' '}
                    <Badge variant="outline" className="mx-1 text-xs">
                      {STAGE_LABELS[item.from_stage as ArticleStage] || item.from_stage}
                    </Badge>
                    to{' '}
                    <Badge variant="outline" className="mx-1 text-xs">
                      {STAGE_LABELS[item.to_stage as ArticleStage] || item.to_stage}
                    </Badge>
                  </p>
                ) : item.action === 'assignment' ? (
                  <p className="text-sm">
                    Assigned{' '}
                    <span className="font-medium">
                      {(item.details as { assigned_user_name?: string })?.assigned_user_name ||
                        'a user'}
                    </span>{' '}
                    as{' '}
                    <Badge variant="outline" className="text-xs capitalize">
                      {(item.details as { role?: string })?.role || 'team member'}
                    </Badge>
                  </p>
                ) : item.action === 'created' ? (
                  <p className="text-sm">
                    Created this article
                    {(item.details as { from_keyword?: string })?.from_keyword && (
                      <>
                        {' '}
                        from keyword &quot;
                        <span className="font-medium">
                          {(item.details as { from_keyword?: string }).from_keyword}
                        </span>
                        &quot;
                      </>
                    )}
                  </p>
                ) : item.action === 'checklist_completed' ? (
                  <p className="text-sm">
                    Completed checklist item:{' '}
                    <span className="font-medium">
                      {(item.details as { item_name?: string })?.item_name || 'item'}
                    </span>
                  </p>
                ) : item.action === 'comment' ? (
                  <p className="text-sm">Added a comment</p>
                ) : (
                  <p className="text-sm capitalize">{item.action.replace(/_/g, ' ')}</p>
                )}
              </div>

              {/* Notes if present */}
              {(item.details as { notes?: string })?.notes && (
                <div className="bg-muted mt-2 rounded-md p-2">
                  <p className="text-muted-foreground text-xs">
                    {(item.details as { notes?: string }).notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
