import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/board - Get all articles for the kanban board
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')
    const monthYear = searchParams.get('month_year')
    const contentType = searchParams.get('content_type')

    let query = supabase
      .from('articles')
      .select(
        `
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
            email,
            avatar_url
          )
        )
      `
      )
      .order('updated_at', { ascending: false })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    if (monthYear) {
      query = query.eq('month_year', monthYear)
    }
    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/board error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
