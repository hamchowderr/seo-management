import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createCompanySchema, paginationSchema } from '@/schemas'
import { createSlug } from '@/lib/utils/naming'
import { createChannel, isSlackConfigured, lookupUserByEmail, inviteToChannel } from '@/lib/slack'

// GET /api/companies - List all companies
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Parse pagination
    const searchParams = request.nextUrl.searchParams
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const offset = (page - 1) * limit

    // Get companies with count
    const {
      data: companies,
      error,
      count,
    } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: companies,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/companies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createCompanySchema.parse(body)

    // Generate slug if not provided
    const slug = validatedData.slug || createSlug(validatedData.name)

    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        ...validatedData,
        slug,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Company with this slug already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-create Slack channel if Slack is configured
    if (isSlackConfigured()) {
      try {
        const channelName = `${slug}-content`
        const channelId = await createChannel(channelName)

        // Update company with Slack channel ID
        await supabase
          .from('companies')
          .update({ slack_channel_id: channelId })
          .eq('id', company.id)

        company.slack_channel_id = channelId

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
      } catch (slackError) {
        // Log but don't fail company creation if Slack fails
        console.error('Failed to create Slack channel:', slackError)
      }
    }

    return NextResponse.json({ data: company }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/companies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
