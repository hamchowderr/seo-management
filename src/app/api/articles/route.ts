import { createAdminClient } from '@/lib/supabase-admin'
import { getApiUser } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createArticleSchema, paginationSchema } from '@/schemas'

// GET /api/articles - List articles
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const isClient = apiUser.role === 'client'

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })
    const companyFilter = searchParams.get('company_id')
    const stageFilter = searchParams.get('stage')
    const contentTypeFilter = searchParams.get('content_type')
    const monthFilter = searchParams.get('month_year')
    const assignedToFilter = searchParams.get('assigned_to')

    const offset = (page - 1) * limit

    // Build select - exclude keywords for clients
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
          users (
            id,
            full_name,
            email
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
          users (
            id,
            full_name,
            email
          )
        )
      `

    // Build query
    let query = supabase
      .from('articles')
      .select(selectFields, { count: 'exact' })
      .order('updated_at', { ascending: false })

    // Filter by user's companies for clients
    if (isClient) {
      if (apiUser.companyIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }
      query = query.in('company_id', apiUser.companyIds)
    }

    if (companyFilter) {
      query = query.eq('company_id', companyFilter)
    }

    if (stageFilter) {
      query = query.eq('stage', stageFilter)
    }

    if (contentTypeFilter) {
      query = query.eq('content_type', contentTypeFilter)
    }

    if (monthFilter) {
      query = query.eq('month_year', monthFilter)
    }

    // Filter by assigned user - get articles where user has an active assignment
    if (assignedToFilter) {
      query = query
        .filter('article_assignments.user_id', 'eq', assignedToFilter)
        .filter('article_assignments.is_active', 'eq', true)
    }

    const { data: articles, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: articles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/articles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/articles - Create article directly (without keyword)
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clients cannot create articles
    if (apiUser.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const body = await request.json()
    const validatedData = createArticleSchema.parse(body)

    // Get next article number
    const { data: nextNumberResult } = await supabase.rpc('get_next_article_number', {
      p_company_id: validatedData.company_id,
      p_month_year: validatedData.month_year,
      p_content_type: validatedData.content_type,
    })

    const articleNumber = nextNumberResult || 1

    // Create article (use first admin user for created_by in dev mode)
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        ...validatedData,
        article_number: articleNumber,
        stage: 'needs_writing',
        created_by: adminUser?.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create history entry
    await supabase.from('article_history').insert({
      article_id: article.id,
      user_id: adminUser?.id,
      action: 'created',
      to_stage: 'needs_writing',
    })

    return NextResponse.json({ data: article }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/articles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
