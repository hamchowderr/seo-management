import { NextResponse } from 'next/server'

// GET /api/auth/google - Initiate Google OAuth flow
// This connects a single admin Google account for the entire app
export async function GET() {
  try {
    // Check required environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.' },
        { status: 500 }
      )
    }

    // Build OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ]

    // Simple state for CSRF protection (no company_id needed - single global token)
    const state = Buffer.from(JSON.stringify({ ts: Date.now() })).toString('base64')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      auth_url: authUrl.toString(),
    })
  } catch (error) {
    console.error('GET /api/auth/google error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
