import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// GET /api/auth/google/callback - Handle Google OAuth callback
// Stores a single global token for the admin's Google account
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(`${appUrl}/integrations?error=${encodeURIComponent(error)}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/integrations?error=${encodeURIComponent('Missing code or state')}`
      )
    }

    // Validate state exists (CSRF protection)
    try {
      JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        `${appUrl}/integrations?error=${encodeURIComponent('Invalid state parameter')}`
      )
    }

    // Check required environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${appUrl}/integrations?error=${encodeURIComponent('Google OAuth not configured')}`
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(
        `${appUrl}/integrations?error=${encodeURIComponent('Failed to exchange code for tokens')}`
      )
    }

    const tokens = await tokenResponse.json()

    // Store tokens in database as global token (company_id = null)
    const supabase = createAdminClient()

    // Check if global Google integration already exists
    const { data: existing } = await supabase
      .from('integration_tokens')
      .select('id')
      .is('company_id', null)
      .eq('provider', 'google')
      .single()

    const tokenData = {
      company_id: null, // Global token - not tied to any company
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      scopes: tokens.scope ? tokens.scope.split(' ') : [],
    }

    if (existing) {
      // Update existing global integration
      const { error: updateError } = await supabase
        .from('integration_tokens')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          scopes: tokenData.scopes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Failed to update integration:', updateError)
        return NextResponse.redirect(
          `${appUrl}/integrations?error=${encodeURIComponent('Failed to save tokens')}`
        )
      }
    } else {
      // Create new global integration
      const { error: insertError } = await supabase.from('integration_tokens').insert(tokenData)

      if (insertError) {
        console.error('Failed to create integration:', insertError)
        return NextResponse.redirect(
          `${appUrl}/integrations?error=${encodeURIComponent('Failed to save tokens')}`
        )
      }
    }

    // Redirect back to integrations page with success
    return NextResponse.redirect(`${appUrl}/integrations?success=true&provider=google`)
  } catch (error) {
    console.error('GET /api/auth/google/callback error:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${appUrl}/integrations?error=${encodeURIComponent('Internal server error')}`
    )
  }
}
