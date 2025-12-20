import { getApiUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { inviteUserSchema } from '@/schemas'

// POST /api/users/invite - Invite a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const user = await getApiUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Parse and validate body
    const body = await request.json()
    const validatedData = inviteUserSchema.parse(body)

    // Send invite via Supabase Auth
    // Emails are caught by Inbucket in local dev (http://127.0.0.1:54324)
    const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      validatedData.email,
      {
        data: {
          full_name: validatedData.full_name,
          role: validatedData.role,
          company_ids: validatedData.company_ids,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }
    )

    if (inviteError) {
      // Handle "user already registered" error
      if (inviteError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
      }
      throw inviteError
    }

    // Create or update user record in users table with invited status
    if (data?.user) {
      const { error: upsertError } = await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: validatedData.email,
          full_name: validatedData.full_name,
          role: validatedData.role,
          is_active: true,
        },
        { onConflict: 'id' }
      )

      if (upsertError) {
        console.error('Failed to create user record:', upsertError)
      }

      // Assign user to companies
      if (validatedData.company_ids?.length > 0) {
        const userCompanies = validatedData.company_ids.map((companyId) => ({
          user_id: data.user.id,
          company_id: companyId,
        }))

        const { error: companyError } = await supabase
          .from('user_companies')
          .upsert(userCompanies, { onConflict: 'user_id,company_id' })

        if (companyError) {
          console.error('Failed to assign companies:', companyError)
        }
      }
    }

    return NextResponse.json(
      {
        message:
          'Invitation sent successfully. Check Inbucket at http://127.0.0.1:54324 for the email.',
        email: validatedData.email,
        role: validatedData.role,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    console.error('POST /api/users/invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
