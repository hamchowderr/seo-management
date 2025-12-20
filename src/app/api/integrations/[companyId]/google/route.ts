import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { uuidSchema } from '@/schemas'

type RouteParams = { params: Promise<{ companyId: string }> }

// GET /api/integrations/[companyId]/google - Get Google integration status for company
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { companyId } = await params
    const validatedCompanyId = uuidSchema.parse(companyId)
    const supabase = createAdminClient()

    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, google_drive_folder_id')
      .eq('id', validatedCompanyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get integration token
    const { data: token } = await supabase
      .from('integration_tokens')
      .select('id, expires_at, updated_at, scopes')
      .eq('company_id', validatedCompanyId)
      .eq('provider', 'google')
      .single()

    const isExpired = token?.expires_at ? new Date(token.expires_at) < new Date() : false

    return NextResponse.json({
      data: {
        company: {
          id: company.id,
          name: company.name,
          google_drive_folder_id: company.google_drive_folder_id,
        },
        connected: !!token && !isExpired,
        expires_at: token?.expires_at || null,
        updated_at: token?.updated_at || null,
        scopes: token?.scopes || [],
        is_expired: isExpired,
      },
    })
  } catch (error) {
    console.error('GET /api/integrations/[companyId]/google error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/integrations/[companyId]/google - Disconnect Google integration
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { companyId } = await params
    const validatedCompanyId = uuidSchema.parse(companyId)
    const supabase = createAdminClient()

    // Check if company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', validatedCompanyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Delete integration token
    const { error: deleteError } = await supabase
      .from('integration_tokens')
      .delete()
      .eq('company_id', validatedCompanyId)
      .eq('provider', 'google')

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Google integration disconnected',
    })
  } catch (error) {
    console.error('DELETE /api/integrations/[companyId]/google error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/integrations/[companyId]/google - Update Google Drive folder ID
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { companyId } = await params
    const validatedCompanyId = uuidSchema.parse(companyId)
    const body = await request.json()
    const supabase = createAdminClient()

    // Update company's Google Drive folder ID
    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({
        google_drive_folder_id: body.google_drive_folder_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedCompanyId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: company,
      message: 'Google Drive folder ID updated',
    })
  } catch (error) {
    console.error('PATCH /api/integrations/[companyId]/google error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
