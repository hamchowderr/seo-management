import { createAdminClient } from '@/lib/supabase-admin'
import { getApiUser } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { updateArticleSchema, uuidSchema } from '@/schemas'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/articles/[id] - Get single article
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()
    const isClient = apiUser.role === 'client'

    const validatedId = uuidSchema.parse(id)

    // Different select for clients - no keywords, no history
    const selectFields = isClient
      ? `
        *,
        companies (
          id,
          name,
          slug
        ),
        article_assignments (
          id,
          user_id,
          assigned_role,
          is_active,
          assigned_at,
          users (
            id,
            full_name,
            email,
            avatar_url
          )
        ),
        article_checklist (
          id,
          checklist_item_id,
          completed_at,
          notes,
          checklist_items (
            id,
            name,
            description
          )
        )
      `
      : `
        *,
        companies (
          id,
          name,
          slug
        ),
        keywords (
          id,
          keyword_text
        ),
        article_assignments (
          id,
          user_id,
          assigned_role,
          is_active,
          assigned_at,
          users (
            id,
            full_name,
            email,
            avatar_url
          )
        ),
        article_checklist (
          id,
          checklist_item_id,
          completed_at,
          notes,
          checklist_items (
            id,
            name,
            description
          )
        ),
        article_history (
          id,
          action,
          from_stage,
          to_stage,
          details,
          created_at,
          users (
            id,
            full_name
          )
        )
      `

    const { data: article, error } = await supabase
      .from('articles')
      .select(selectFields)
      .eq('id', validatedId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verify company access for clients
    // Cast to access company_id since TypeScript can't infer from dynamic select
    const articleData = article as unknown as { company_id: string } | null
    if (isClient && articleData && !apiUser.companyIds.includes(articleData.company_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: article })
  } catch (error) {
    console.error('GET /api/articles/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/articles/[id] - Update article
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clients cannot update articles
    if (apiUser.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)
    const body = await request.json()
    const validatedData = updateArticleSchema.parse(body)

    // If content is being updated, set content_updated_at
    const updatePayload =
      validatedData.content !== undefined
        ? { ...validatedData, content_updated_at: new Date().toISOString() }
        : validatedData

    const { data: article, error } = await supabase
      .from('articles')
      .update(updatePayload)
      .eq('id', validatedId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get admin user for history
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    // Create history entry
    await supabase.from('article_history').insert({
      article_id: article.id,
      user_id: adminUser?.id,
      action: 'updated',
      details: validatedData,
    })

    return NextResponse.json({ data: article })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('PUT /api/articles/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/articles/[id] - Delete article
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clients cannot delete articles
    if (apiUser.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)

    // Check if article is published
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('stage')
      .eq('id', validatedId)
      .single()

    if (existingArticle?.stage === 'published') {
      return NextResponse.json({ error: 'Cannot delete a published article' }, { status: 400 })
    }

    const { error } = await supabase.from('articles').delete().eq('id', validatedId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/articles/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
