import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createCommentSchema, uuidSchema } from '@/schemas'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/articles/[id]/comments - Get all comments for an article
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)

    // Check if article exists
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('id', validatedId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Get comments with user info
    const { data: comments, error: commentsError } = await supabase
      .from('article_comments')
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user:users!article_comments_user_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      `
      )
      .eq('article_id', validatedId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: comments || [],
      count: comments?.length || 0,
    })
  } catch (error) {
    console.error('GET /api/articles/[id]/comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/articles/[id]/comments - Create a new comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

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

    // Clients cannot create comments
    if (adminUser.role === 'client') {
      return NextResponse.json({ error: 'Clients cannot add comments' }, { status: 403 })
    }

    const validatedId = uuidSchema.parse(id)
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Check if article exists
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, company_id')
      .eq('id', validatedId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Create the comment
    const { data: comment, error: createError } = await supabase
      .from('article_comments')
      .insert({
        article_id: validatedId,
        user_id: adminUser.id,
        content: validatedData.content,
      })
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user:users!article_comments_user_id_fkey (
          id,
          full_name,
          avatar_url,
          role
        )
      `
      )
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Log to article history
    await supabase.from('article_history').insert({
      article_id: validatedId,
      user_id: adminUser.id,
      action: 'comment_added',
      details: { comment_id: comment.id },
    })

    return NextResponse.json(
      {
        data: comment,
        message: 'Comment added',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/articles/[id]/comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
