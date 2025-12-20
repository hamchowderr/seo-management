import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { completeChecklistItemSchema, uuidSchema } from '@/schemas'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/articles/[id]/checklist - Get checklist status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)

    // Get all checklist items
    const { data: allItems, error: itemsError } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Get completed items for this article
    const { data: completedItems, error: completedError } = await supabase
      .from('article_checklist')
      .select(
        `
        *,
        completed_by_user:users!article_checklist_completed_by_fkey (
          id,
          full_name
        )
      `
      )
      .eq('article_id', validatedId)

    if (completedError) {
      return NextResponse.json({ error: completedError.message }, { status: 500 })
    }

    // Merge data
    const completedMap = new Map(completedItems?.map((c) => [c.checklist_item_id, c]) || [])

    const checklist = allItems?.map((item) => ({
      ...item,
      completed: completedMap.has(item.id),
      completion: completedMap.get(item.id) || null,
    }))

    const totalItems = checklist?.length || 0
    const completedCount = checklist?.filter((c) => c.completed).length || 0

    return NextResponse.json({
      data: checklist,
      summary: {
        total: totalItems,
        completed: completedCount,
        remaining: totalItems - completedCount,
        allComplete: totalItems === completedCount,
      },
    })
  } catch (error) {
    console.error('GET /api/articles/[id]/checklist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/articles/[id]/checklist - Complete a checklist item
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
    const validatedData = completeChecklistItemSchema.parse(body)

    // Check if article exists and is in posting stage
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, stage')
      .eq('id', validatedId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (article.stage !== 'assigned_for_posting') {
      return NextResponse.json(
        {
          error: 'Checklist can only be completed when article is in posting stage',
        },
        { status: 400 }
      )
    }

    // Check if checklist item exists
    const { data: checklistItem, error: itemError } = await supabase
      .from('checklist_items')
      .select('id')
      .eq('id', validatedData.checklist_item_id)
      .eq('is_active', true)
      .single()

    if (itemError || !checklistItem) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from('article_checklist')
      .select('id')
      .eq('article_id', validatedId)
      .eq('checklist_item_id', validatedData.checklist_item_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Checklist item already completed' }, { status: 409 })
    }

    // Complete the item
    const { data: completion, error: completeError } = await supabase
      .from('article_checklist')
      .insert({
        article_id: validatedId,
        checklist_item_id: validatedData.checklist_item_id,
        completed_by: adminUser?.id,
        notes: validatedData.notes,
      })
      .select()
      .single()

    if (completeError) {
      return NextResponse.json({ error: completeError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        data: completion,
        message: 'Checklist item completed',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/articles/[id]/checklist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/articles/[id]/checklist - Uncomplete a checklist item
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const validatedId = uuidSchema.parse(id)
    const { searchParams } = new URL(request.url)
    const checklistItemId = searchParams.get('checklist_item_id')

    if (!checklistItemId) {
      return NextResponse.json({ error: 'checklist_item_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('article_checklist')
      .delete()
      .eq('article_id', validatedId)
      .eq('checklist_item_id', checklistItemId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Checklist item uncompleted' })
  } catch (error) {
    console.error('DELETE /api/articles/[id]/checklist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
