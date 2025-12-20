import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { moveArticleSchema, uuidSchema } from '@/schemas'
import { canTransitionTo, STAGE_LABELS } from '@/lib/constants/stages'
import type { UserRole } from '@/lib/constants/roles'
import type { ArticleStage } from '@/schemas'
import { notifyStageChange, notifyArticlePublished } from '@/lib/notifications'
import { createNamedVersion } from '@/lib/google-drive'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/articles/[id]/move - Move article to different stage
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // For development, use admin role to allow all transitions
    const userRole: UserRole = 'admin'

    // Get admin user for history tracking
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    const validatedId = uuidSchema.parse(id)
    const body = await request.json()
    const validatedData = moveArticleSchema.parse(body)

    // Get current article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*, companies(name)')
      .eq('id', validatedId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const currentStage = article.stage as ArticleStage
    const targetStage = validatedData.to_stage

    // Check if transition is allowed
    if (!canTransitionTo(currentStage, targetStage, userRole)) {
      return NextResponse.json(
        {
          error: 'Stage transition not allowed',
          details: `Cannot move from ${currentStage} to ${targetStage} with role ${userRole}`,
        },
        { status: 403 }
      )
    }

    // Special handling for publishing
    if (targetStage === 'published') {
      // Check if all checklist items are completed
      const { data: checklistItems } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('is_active', true)

      const { data: completedItems } = await supabase
        .from('article_checklist')
        .select('checklist_item_id')
        .eq('article_id', validatedId)

      const allItemIds = checklistItems?.map((i) => i.id) || []
      const completedIds = completedItems?.map((c) => c.checklist_item_id) || []

      const allCompleted = allItemIds.every((id) => completedIds.includes(id))

      if (!allCompleted) {
        return NextResponse.json(
          {
            error: 'All checklist items must be completed before publishing',
          },
          { status: 400 }
        )
      }
    }

    // Update article stage
    const updateData: Record<string, unknown> = { stage: targetStage }

    if (targetStage === 'published') {
      updateData.published_at = new Date().toISOString()
    }

    const { data: updatedArticle, error: updateError } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', validatedId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Complete current assignment if moving forward
    if (currentStage !== targetStage) {
      const stageRoleMap: Record<string, string> = {
        needs_writing: 'writer',
        ready_for_editing: 'editor',
        assigned_for_posting: 'poster',
      }

      const roleToComplete = stageRoleMap[currentStage]
      if (roleToComplete) {
        await supabase
          .from('article_assignments')
          .update({
            is_active: false,
            completed_at: new Date().toISOString(),
          })
          .eq('article_id', validatedId)
          .eq('assigned_role', roleToComplete)
          .eq('is_active', true)
      }
    }

    // Create history entry
    await supabase.from('article_history').insert({
      article_id: validatedId,
      user_id: adminUser?.id,
      action: 'stage_change',
      from_stage: currentStage,
      to_stage: targetStage,
      details: validatedData.notes ? { notes: validatedData.notes } : null,
    })

    // Send notifications (fire and forget - don't block response)
    const articleForNotification = {
      id: validatedId,
      full_title: updatedArticle.full_title,
      title: updatedArticle.title,
      google_doc_url: updatedArticle.google_doc_url,
      published_url: updatedArticle.published_url,
      company_id: updatedArticle.company_id,
    }

    if (targetStage === 'published') {
      notifyArticlePublished(articleForNotification).catch(console.error)
    } else {
      notifyStageChange(articleForNotification, currentStage, targetStage).catch(console.error)
    }

    // Create named version in Google Doc for key stages (fire and forget)
    const namedVersionStages: ArticleStage[] = [
      'ready_for_editing',
      'ready_for_approval',
      'published',
    ]
    if (namedVersionStages.includes(targetStage) && updatedArticle.google_doc_id) {
      createNamedVersion(updatedArticle.google_doc_id, `Stage: ${STAGE_LABELS[targetStage]}`).catch(
        (err) => {
          console.warn('Failed to create named version:', err)
        }
      )
    }

    return NextResponse.json({
      data: updatedArticle,
      message: `Article moved from ${currentStage} to ${targetStage}`,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/articles/[id]/move error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
