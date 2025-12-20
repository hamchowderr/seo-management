import { createAdminClient } from '@/lib/supabase-admin'
import { getApiUser } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { convertKeywordSchema, uuidSchema } from '@/schemas'
import { isGoogleDriveConnected, getOrCreateMonthFolder, createDocument } from '@/lib/google-drive'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/keywords/[id]/convert - Convert keyword to article
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clients cannot convert keywords
    if (apiUser.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    // Parse request body
    const body = await request.json()
    const validatedData = convertKeywordSchema.parse({ ...body, keyword_id: validatedId })

    // Get the keyword with company info including Drive folder
    const { data: keyword, error: keywordError } = await supabase
      .from('keywords')
      .select(
        `
        *,
        companies (
          id,
          name,
          slug,
          google_drive_folder_id
        )
      `
      )
      .eq('id', validatedId)
      .single()

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
    }

    if (keyword.is_used) {
      return NextResponse.json({ error: 'Keyword already converted to article' }, { status: 400 })
    }

    // Get next article number for this company/month/type
    const { data: nextNumberResult } = await supabase.rpc('get_next_article_number', {
      p_company_id: keyword.company_id,
      p_month_year: keyword.month_year,
      p_content_type: keyword.content_type,
    })

    const articleNumber = nextNumberResult || 1

    // Create the article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert({
        company_id: keyword.company_id,
        keyword_id: keyword.id,
        title: validatedData.title || keyword.keyword_text,
        content_type: keyword.content_type,
        month_year: keyword.month_year,
        article_number: articleNumber,
        stage: 'needs_writing',
        created_by: adminUser?.id,
      })
      .select()
      .single()

    if (articleError) {
      return NextResponse.json({ error: articleError.message }, { status: 500 })
    }

    // Mark keyword as used
    await supabase
      .from('keywords')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', validatedId)

    // If assigned_writer_id is provided, create assignment
    if (validatedData.assigned_writer_id) {
      await supabase.from('article_assignments').insert({
        article_id: article.id,
        user_id: validatedData.assigned_writer_id,
        assigned_role: 'writer',
      })
    }

    // Create history entry
    await supabase.from('article_history').insert({
      article_id: article.id,
      user_id: adminUser?.id,
      action: 'created',
      to_stage: 'needs_writing',
      details: {
        from_keyword: keyword.keyword_text,
        keyword_id: keyword.id,
      },
    })

    // Auto-create Google Doc if Drive is connected and company has a folder
    let googleDocId: string | null = null
    let googleDocUrl: string | null = null

    const company = keyword.companies as {
      id: string
      name: string
      slug: string
      google_drive_folder_id: string | null
    }

    if (company?.google_drive_folder_id) {
      try {
        const driveConnected = await isGoogleDriveConnected()
        if (driveConnected) {
          // Get or create month folder
          const monthFolder = await getOrCreateMonthFolder(
            company.google_drive_folder_id,
            keyword.month_year
          )

          // Create Google Doc with the article's full_title
          const doc = await createDocument(article.full_title || article.title, monthFolder.id)

          googleDocId = doc.id
          googleDocUrl = doc.webViewLink

          // Update article with Google Doc info
          await supabase
            .from('articles')
            .update({
              google_doc_id: googleDocId,
              google_doc_url: googleDocUrl,
            })
            .eq('id', article.id)
        }
      } catch (driveError) {
        // Log but don't fail the article creation
        console.error('Failed to create Google Doc:', driveError)
      }
    }

    // Include Google Doc info in response
    const responseArticle = {
      ...article,
      google_doc_id: googleDocId,
      google_doc_url: googleDocUrl,
    }

    return NextResponse.json(
      {
        data: responseArticle,
        message: 'Keyword converted to article successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/keywords/[id]/convert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
