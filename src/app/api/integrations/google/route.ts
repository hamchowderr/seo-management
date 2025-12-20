import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// DELETE /api/integrations/google - Disconnect global Google integration
export async function DELETE() {
  try {
    const supabase = createAdminClient()

    // Delete global Google token
    const { error } = await supabase
      .from('integration_tokens')
      .delete()
      .is('company_id', null)
      .eq('provider', 'google')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Google Drive disconnected',
    })
  } catch (error) {
    console.error('DELETE /api/integrations/google error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
