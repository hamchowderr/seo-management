import { createAdminClient } from '@/lib/supabase-admin'
import { getApiUser } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { updateKeywordSchema, uuidSchema } from '@/schemas'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/keywords/[id] - Get single keyword
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)

    const { data: keyword, error } = await supabase
      .from('keywords')
      .select(
        `
        *,
        companies (
          id,
          name,
          slug
        )
      `
      )
      .eq('id', validatedId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keyword })
  } catch (error) {
    console.error('GET /api/keywords/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/keywords/[id] - Update keyword
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clients cannot update keywords
    if (apiUser.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)
    const body = await request.json()
    const validatedData = updateKeywordSchema.parse(body)

    // Check if keyword is already used
    const { data: existingKeyword } = await supabase
      .from('keywords')
      .select('is_used')
      .eq('id', validatedId)
      .single()

    if (existingKeyword?.is_used) {
      return NextResponse.json({ error: 'Cannot edit a used keyword' }, { status: 400 })
    }

    const { data: keyword, error } = await supabase
      .from('keywords')
      .update(validatedData)
      .eq('id', validatedId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keyword })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('PUT /api/keywords/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/keywords/[id] - Delete keyword
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clients cannot delete keywords
    if (apiUser.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)

    // Check if keyword is already used
    const { data: existingKeyword } = await supabase
      .from('keywords')
      .select('is_used')
      .eq('id', validatedId)
      .single()

    if (existingKeyword?.is_used) {
      return NextResponse.json({ error: 'Cannot delete a used keyword' }, { status: 400 })
    }

    const { error } = await supabase.from('keywords').delete().eq('id', validatedId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Keyword deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/keywords/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
