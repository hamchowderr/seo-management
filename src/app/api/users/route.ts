import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { paginationSchema } from '@/schemas'

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Parse pagination and filters
    const searchParams = request.nextUrl.searchParams
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })
    const roleFilter = searchParams.get('role')
    const companyFilter = searchParams.get('company_id')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('users')
      .select(
        `
        *,
        user_companies (
          company_id,
          companies (
            id,
            name,
            slug
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('full_name')

    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }

    if (companyFilter) {
      query = query.contains('user_companies', [{ company_id: companyFilter }])
    }

    const { data: users, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
