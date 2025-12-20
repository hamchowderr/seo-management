import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createChannel, isSlackConfigured, lookupUserByEmail, inviteToChannel } from '@/lib/slack'
import { z } from 'zod'

const createChannelSchema = z.object({
  company_id: z
    .string()
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Invalid UUID format'
    ),
})

// POST /api/integrations/slack/channels - Create a Slack channel for a company
export async function POST(request: NextRequest) {
  try {
    if (!isSlackConfigured()) {
      return NextResponse.json(
        { error: 'Slack not configured. Set SLACK_BOT_TOKEN environment variable.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { company_id } = createChannelSchema.parse(body)

    const supabase = createAdminClient()

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, slug, slack_channel_id')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if channel already exists
    if (company.slack_channel_id) {
      return NextResponse.json(
        { error: 'Company already has a Slack channel configured' },
        { status: 400 }
      )
    }

    // Create channel in Slack
    const channelName = `${company.slug}-content`
    const channelId = await createChannel(channelName)

    // Update company with channel ID
    const { error: updateError } = await supabase
      .from('companies')
      .update({ slack_channel_id: channelId })
      .eq('id', company_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Auto-invite all admin users to the channel
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .eq('is_active', true)

    if (admins) {
      for (const admin of admins) {
        const slackUserId = await lookupUserByEmail(admin.email)
        if (slackUserId) {
          await inviteToChannel(channelId, slackUserId)
        }
      }
    }

    return NextResponse.json({
      data: {
        channel_id: channelId,
        channel_name: channelName,
      },
      message: `Slack channel #${channelName} created`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('POST /api/integrations/slack/channels error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
