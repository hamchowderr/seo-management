import { createAdminClient } from '@/lib/supabase-admin'
import { getApiUser } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { uuidSchema } from '@/schemas'
import { getDocumentRevisions } from '@/lib/google-drive'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/articles/[id]/revisions - Get Google Doc revision history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const validatedId = uuidSchema.parse(id)

    const supabase = createAdminClient()

    // Get the article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, google_doc_id')
      .eq('id', validatedId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (!article.google_doc_id) {
      return NextResponse.json({ error: 'Article has no Google Doc' }, { status: 404 })
    }

    // Fetch revisions from Google Drive
    const revisions = await getDocumentRevisions(article.google_doc_id)

    // Sort by most recent first
    const sortedRevisions = revisions.sort(
      (a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
    )

    return NextResponse.json({
      data: sortedRevisions,
      documentId: article.google_doc_id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Google Drive not connected') {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 503 })
    }
    console.error('GET /api/articles/[id]/revisions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
