import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { assignArticleSchema, uuidSchema } from '@/schemas'
import { notifyAssignment } from '@/lib/notifications'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/articles/[id]/assign - Get current assignments
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)

    const { data: assignments, error } = await supabase
      .from('article_assignments')
      .select(
        `
        *,
        users (
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `
      )
      .eq('article_id', validatedId)
      .order('assigned_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: assignments })
  } catch (error) {
    console.error('GET /api/articles/[id]/assign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/articles/[id]/assign - Assign user to article
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Get admin user for tracking
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    const validatedId = uuidSchema.parse(id)
    const body = await request.json()
    const validatedData = assignArticleSchema.parse(body)

    // Check if article exists
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, stage')
      .eq('id', validatedId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if user exists and has the appropriate role
    const { data: assignee, error: userError } = await supabase
      .from('users')
      .select('id, role, full_name')
      .eq('id', validatedData.user_id)
      .single()

    if (userError || !assignee) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify role match (writer can only be assigned as writer, etc.)
    if (
      assignee.role !== validatedData.role &&
      !['admin', 'project_manager'].includes(assignee.role)
    ) {
      return NextResponse.json(
        {
          error: `User ${assignee.full_name} is a ${assignee.role}, not a ${validatedData.role}`,
        },
        { status: 400 }
      )
    }

    // Deactivate existing assignment for this role
    await supabase
      .from('article_assignments')
      .update({ is_active: false })
      .eq('article_id', validatedId)
      .eq('assigned_role', validatedData.role)
      .eq('is_active', true)

    // Create new assignment
    const { data: assignment, error: assignError } = await supabase
      .from('article_assignments')
      .insert({
        article_id: validatedId,
        user_id: validatedData.user_id,
        assigned_role: validatedData.role,
      })
      .select(
        `
        *,
        users (
          id,
          full_name,
          email
        )
      `
      )
      .single()

    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 500 })
    }

    // Create history entry
    await supabase.from('article_history').insert({
      article_id: validatedId,
      user_id: adminUser?.id,
      action: 'assignment',
      details: {
        assigned_user_id: validatedData.user_id,
        assigned_user_name: assignee.full_name,
        role: validatedData.role,
      },
    })

    // Get full article details for notification
    const { data: articleDetails } = await supabase
      .from('articles')
      .select('id, full_title, title, google_doc_url, published_url, company_id')
      .eq('id', validatedId)
      .single()

    // Get assignee notification preferences
    const { data: assigneeDetails } = await supabase
      .from('users')
      .select('id, full_name, email, slack_user_id, notification_preference')
      .eq('id', validatedData.user_id)
      .single()

    // Send notification (fire and forget)
    if (articleDetails && assigneeDetails) {
      notifyAssignment(articleDetails, assigneeDetails, validatedData.role).catch(console.error)
    }

    return NextResponse.json(
      {
        data: assignment,
        message: `${assignee.full_name} assigned as ${validatedData.role}`,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/articles/[id]/assign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/articles/[id]/assign - Remove assignment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignment_id')

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignment_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('article_assignments')
      .update({ is_active: false })
      .eq('id', assignmentId)
      .eq('article_id', validatedId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Assignment removed successfully' })
  } catch (error) {
    console.error('DELETE /api/articles/[id]/assign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
