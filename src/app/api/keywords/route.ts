import { createAdminClient } from '@/lib/supabase-admin'
import { getApiUser } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { createKeywordSchema, bulkCreateKeywordsSchema, paginationSchema } from '@/schemas'

// GET /api/keywords - List keywords
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clients cannot access keywords
    if (apiUser.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })
    const companyFilter = searchParams.get('company_id')
    const usedFilter = searchParams.get('is_used')
    const monthFilter = searchParams.get('month_year')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('keywords')
      .select(
        `
        *,
        companies (
          id,
          name,
          slug
        ),
        submitted_by_user:users!keywords_submitted_by_fkey (
          id,
          full_name
        ),
        articles (
          id,
          title,
          stage
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (companyFilter) {
      query = query.eq('company_id', companyFilter)
    }

    if (usedFilter !== null) {
      query = query.eq('is_used', usedFilter === 'true')
    }

    if (monthFilter) {
      query = query.eq('month_year', monthFilter)
    }

    const { data: keywords, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: keywords,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/keywords error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/keywords - Create keyword(s)
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clients cannot create keywords
    if (apiUser.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Get admin user for submitted_by
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    const body = await request.json()

    // Check if it's a bulk create or single create
    if (body.keywords && Array.isArray(body.keywords)) {
      // Bulk create
      const validatedData = bulkCreateKeywordsSchema.parse(body)

      const keywordsToInsert = validatedData.keywords.map((keyword) => ({
        company_id: validatedData.company_id,
        keyword_text: keyword,
        content_type: validatedData.content_type,
        month_year: validatedData.month_year,
        submitted_by: adminUser?.id,
      }))

      const { data: keywords, error } = await supabase
        .from('keywords')
        .insert(keywordsToInsert)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data: keywords, count: keywords.length }, { status: 201 })
    } else {
      // Single create
      const validatedData = createKeywordSchema.parse(body)

      const { data: keyword, error } = await supabase
        .from('keywords')
        .insert({
          ...validatedData,
          submitted_by: adminUser?.id,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data: keyword }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/keywords error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
