'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Send, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string
  }
}

interface ArticleCommentsProps {
  articleId: string
  currentUserId?: string
  isAdmin?: boolean
}

export function ArticleComments({
  articleId,
  currentUserId,
  isAdmin = false,
}: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`)
      const data = await response.json()
      if (response.ok) {
        setComments(data.data || [])
      } else {
        console.error('Failed to fetch comments:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }, [articleId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        setNewComment('')
        toast.success('Comment added')
        fetchComments()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add comment')
      }
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setDeletingId(commentId)
    try {
      const response = await fetch(`/api/articles/${articleId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Comment deleted')
        fetchComments()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete comment')
      }
    } catch {
      toast.error('Failed to delete comment')
    } finally {
      setDeletingId(null)
    }
  }

  const canDeleteComment = (comment: Comment) => {
    return isAdmin || comment.user.id === currentUserId
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Comment list - scrollable */}
      <ScrollArea className="flex-1 pr-3">
        <div className="space-y-4 pb-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="text-muted-foreground/50 mb-3 h-8 w-8" />
              <p className="text-muted-foreground text-sm">No comments yet</p>
              <p className="text-muted-foreground/70 mt-1 text-xs">Start the conversation</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex items-start gap-2.5">
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={comment.user.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(comment.user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm leading-none font-medium">
                        {comment.user.full_name?.split(' ')[0] || 'Unknown'}
                      </span>
                      <span className="text-muted-foreground/70 text-[10px]">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: false })}
                      </span>
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="text-muted-foreground/50 hover:text-destructive ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-foreground mt-1 text-[13px] leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add comment form - fixed at bottom */}
      <div className="border-border/50 flex-shrink-0 border-t pt-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
            disabled={submitting}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newComment.trim() || submitting}
            className="h-9 w-9 flex-shrink-0"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
