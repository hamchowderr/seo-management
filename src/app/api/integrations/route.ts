import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { isSlackConfigured } from '@/lib/slack'

// GET /api/integrations - Get global integration status and company list
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get global Google token (company_id is null)
    const { data: googleToken } = await supabase
      .from('integration_tokens')
      .select('id, expires_at, updated_at')
      .is('company_id', null)
      .eq('provider', 'google')
      .single()

    const googleExpired = googleToken?.expires_at
      ? new Date(googleToken.expires_at) < new Date()
      : false

    // Get all companies with their folder IDs and Slack channel IDs
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, slug, google_drive_folder_id, slack_channel_id')
      .eq('is_active', true)
      .order('name')

    if (companiesError) {
      return NextResponse.json({ error: companiesError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        // Global integration status
        google: {
          connected: !!googleToken && !googleExpired,
          is_expired: googleExpired,
          updated_at: googleToken?.updated_at || null,
        },
        slack: {
          configured: isSlackConfigured(),
        },
        // Company-specific settings
        companies:
          companies?.map((company) => ({
            id: company.id,
            name: company.name,
            slug: company.slug,
            google_drive_folder_id: company.google_drive_folder_id,
            slack_channel_id: company.slack_channel_id,
          })) || [],
      },
    })
  } catch (error) {
    console.error('GET /api/integrations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
