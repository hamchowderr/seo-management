import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { updateUserSchema, uuidSchema } from '@/schemas'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Validate ID
    const validatedId = uuidSchema.parse(id)

    // Get user with company assignments
    const { data: userData, error } = await supabase
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
      `
      )
      .eq('id', validatedId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: userData })
  } catch (error) {
    console.error('GET /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Validate ID
    const validatedId = uuidSchema.parse(id)

    // Parse and validate body
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Update user
    const { data: userData, error } = await supabase
      .from('users')
      .update(validatedData)
      .eq('id', validatedId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: userData })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('PUT /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Deactivate user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Validate ID
    const validatedId = uuidSchema.parse(id)

    // Soft delete (set is_active to false)
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', validatedId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
