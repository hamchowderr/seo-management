import { createAdminClient } from '@/lib/supabase-admin'
import { getApiUser } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { importKeywordsSchema } from '@/schemas'

interface ImportResult {
  success: number
  failed: number
  duplicates: number
  errors: Array<{ keyword: string; error: string }>
}

// POST /api/keywords/import - Import keywords from CSV data
export async function POST(request: NextRequest) {
  try {
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and project managers can import keywords
    if (!['admin', 'project_manager'].includes(apiUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = importKeywordsSchema.parse(body)

    const supabase = createAdminClient()

    // Get admin user for created_by field
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    // Check for duplicates in database
    const keywordTexts = validatedData.keywords.map((k) => k.keyword_text)

    const { data: existingKeywords } = await supabase
      .from('keywords')
      .select('keyword_text, month_year')
      .eq('company_id', validatedData.company_id)
      .in('keyword_text', keywordTexts)

    // Create a set of existing keyword keys for quick lookup
    const existingSet = new Set(
      (existingKeywords || []).map((k) => `${k.keyword_text}|${k.month_year}`)
    )

    const result: ImportResult = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    }

    // Process keywords
    const toInsert: Array<{
      company_id: string
      keyword_text: string
      content_type: 'blog' | 'seo'
      month_year: string
      created_by: string | undefined
    }> = []

    for (const keyword of validatedData.keywords) {
      const key = `${keyword.keyword_text}|${keyword.month_year}`

      if (existingSet.has(key)) {
        result.duplicates++
        result.errors.push({
          keyword: keyword.keyword_text,
          error: `Duplicate: keyword already exists for ${keyword.month_year}`,
        })
        continue
      }

      // Check for duplicates within the import batch
      const isDuplicateInBatch = toInsert.some(
        (k) => k.keyword_text === keyword.keyword_text && k.month_year === keyword.month_year
      )

      if (isDuplicateInBatch) {
        result.duplicates++
        result.errors.push({
          keyword: keyword.keyword_text,
          error: 'Duplicate: keyword appears multiple times in import',
        })
        continue
      }

      toInsert.push({
        company_id: validatedData.company_id,
        keyword_text: keyword.keyword_text,
        content_type: keyword.content_type,
        month_year: keyword.month_year,
        created_by: adminUser?.id,
      })
    }

    // Bulk insert valid keywords
    if (toInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('keywords')
        .insert(toInsert)
        .select()

      if (insertError) {
        console.error('Bulk insert error:', insertError)
        result.failed = toInsert.length
        result.errors.push({
          keyword: 'BULK_INSERT',
          error: insertError.message,
        })
      } else {
        result.success = inserted?.length || 0
        result.failed = toInsert.length - result.success
      }
    }

    return NextResponse.json({
      data: result,
      message: `Imported ${result.success} keywords, ${result.duplicates} duplicates skipped, ${result.failed} failed`,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/keywords/import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
