import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { updateCompanySchema, uuidSchema } from '@/schemas'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/companies/[id] - Get single company
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Validate ID
    const validatedId = uuidSchema.parse(id)

    // Get company
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', validatedId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: company })
  } catch (error) {
    console.error('GET /api/companies/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT/PATCH /api/companies/[id] - Update company
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Validate ID and body
    const validatedId = uuidSchema.parse(id)
    const body = await request.json()
    const validatedData = updateCompanySchema.parse(body)

    // Update company
    const { data: company, error } = await supabase
      .from('companies')
      .update(validatedData)
      .eq('id', validatedId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: company })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('PUT /api/companies/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/companies/[id] - Soft delete company
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Validate ID
    const validatedId = uuidSchema.parse(id)

    // Soft delete (set is_active to false)
    const { error } = await supabase
      .from('companies')
      .update({ is_active: false })
      .eq('id', validatedId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/companies/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH handler - alias to PUT for client compatibility
export { PUT as PATCH }
