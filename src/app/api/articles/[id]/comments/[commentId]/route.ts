import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { uuidSchema } from '@/schemas'

type RouteParams = { params: Promise<{ id: string; commentId: string }> }

// DELETE /api/articles/[id]/comments/[commentId] - Delete a comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, commentId } = await params
    const supabase = createAdminClient()

    const validatedArticleId = uuidSchema.parse(id)
    const validatedCommentId = uuidSchema.parse(commentId)

    // Get admin user for tracking (in production, use session user)
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if comment exists and belongs to this article
    const { data: comment, error: commentError } = await supabase
      .from('article_comments')
      .select('id, user_id, article_id')
      .eq('id', validatedCommentId)
      .eq('article_id', validatedArticleId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Only allow deletion by comment author or admin
    const isAdmin = adminUser.role === 'admin'
    const isAuthor = comment.user_id === adminUser.id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: 'Cannot delete comments from other users' },
        { status: 403 }
      )
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', validatedCommentId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Log to article history
    await supabase.from('article_history').insert({
      article_id: validatedArticleId,
      user_id: adminUser.id,
      action: 'comment_deleted',
      details: { comment_id: validatedCommentId },
    })

    return NextResponse.json({ message: 'Comment deleted' })
  } catch (error) {
    console.error('DELETE /api/articles/[id]/comments/[commentId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
