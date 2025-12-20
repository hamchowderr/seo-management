import { createClient } from '@/lib/server'
import { createAdminClient } from '@/lib/supabase-admin'
import type { UserRole } from '@/lib/constants/roles'

export interface ApiUser {
  id: string
  role: UserRole
  companyIds: string[]
}

/**
 * Get the current authenticated user's info for API routes.
 * Uses the server client to verify authentication, then fetches role and company associations.
 * Returns null if user is not authenticated.
 */
export async function getApiUser(): Promise<ApiUser | null> {
  // Use server client (respects auth cookies) to get current user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Use admin client to fetch user profile and company associations
  const adminClient = createAdminClient()

  const [profileResult, companiesResult] = await Promise.all([
    adminClient.from('users').select('role').eq('id', user.id).single(),
    adminClient.from('user_companies').select('company_id').eq('user_id', user.id),
  ])

  return {
    id: user.id,
    role: (profileResult.data?.role as UserRole) || 'client',
    companyIds: companiesResult.data?.map((uc) => uc.company_id) || [],
  }
}
