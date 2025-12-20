import { createAdminClient } from '@/lib/supabase-admin'
import { getApiUser } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'

interface ArticlesByMonth {
  month: string
  count: number
}

interface ArticlesByClient {
  client: string
  count: number
}

interface ArticlesByType {
  type: string
  count: number
}

interface AverageTimePerStage {
  stage: string
  avgDays: number
}

interface ArticlesByStage {
  stage: string
  count: number
}

interface ReportsData {
  articlesByMonth: ArticlesByMonth[]
  articlesByClient: ArticlesByClient[]
  articlesByType: ArticlesByType[]
  averageTimePerStage: AverageTimePerStage[]
  articlesByStage: ArticlesByStage[]
  overview: {
    totalArticles: number
    publishedThisMonth: number
    totalCompanies: number
    totalKeywords: number
    usedKeywords: number
  }
}

// GET /api/reports - Get aggregated report data
export async function GET(request: NextRequest) {
  try {
    const apiUser = await getApiUser()
    if (!apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and project managers can view reports
    if (!['admin', 'project_manager'].includes(apiUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    const supabase = createAdminClient()

    // Build base query with optional company filter
    const buildQuery = (table: string) => {
      let query = supabase.from(table).select('*')
      if (companyId) {
        query = query.eq('company_id', companyId)
      }
      return query
    }

    // Fetch all articles
    const { data: articles } = await buildQuery('articles')

    // Fetch all companies
    const { data: companies } = await supabase.from('companies').select('id, name')

    // Fetch all keywords
    const { data: keywords } = await buildQuery('keywords')

    // Fetch completed assignments for time calculations
    const { data: completedAssignments } = await supabase
      .from('article_assignments')
      .select('assigned_role, duration_seconds')
      .not('completed_at', 'is', null)
      .not('duration_seconds', 'is', null)

    const allArticles = articles || []
    const allCompanies = companies || []
    const allKeywords = keywords || []
    const allAssignments = completedAssignments || []

    // Calculate articles by month (last 12 months)
    const now = new Date()
    const monthsBack = 12
    const articlesByMonth: ArticlesByMonth[] = []

    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date
        .toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        .toUpperCase()
        .replace(' ', '')

      const count = allArticles.filter((a) => {
        const createdDate = new Date(a.created_at)
        return (
          createdDate.getMonth() === date.getMonth() &&
          createdDate.getFullYear() === date.getFullYear()
        )
      }).length

      articlesByMonth.push({ month: monthKey, count })
    }

    // Calculate articles by client
    const clientCounts = new Map<string, number>()
    for (const article of allArticles) {
      const company = allCompanies.find((c) => c.id === article.company_id)
      if (company) {
        const current = clientCounts.get(company.name) || 0
        clientCounts.set(company.name, current + 1)
      }
    }
    const articlesByClient: ArticlesByClient[] = Array.from(clientCounts.entries())
      .map(([client, count]) => ({ client, count }))
      .sort((a, b) => b.count - a.count)

    // Calculate articles by type
    const typeCounts = new Map<string, number>()
    for (const article of allArticles) {
      const type = article.content_type === 'blog' ? 'Blog' : 'SEO'
      const current = typeCounts.get(type) || 0
      typeCounts.set(type, current + 1)
    }
    const articlesByType: ArticlesByType[] = Array.from(typeCounts.entries()).map(
      ([type, count]) => ({
        type,
        count,
      })
    )

    // Calculate average time per stage (role)
    const roleLabels: Record<string, string> = {
      writer: 'Writing',
      editor: 'Editing',
      poster: 'Posting',
    }
    const roleTimeTotals = new Map<string, { total: number; count: number }>()

    for (const assignment of allAssignments) {
      if (assignment.duration_seconds) {
        const role = assignment.assigned_role
        const current = roleTimeTotals.get(role) || { total: 0, count: 0 }
        roleTimeTotals.set(role, {
          total: current.total + assignment.duration_seconds,
          count: current.count + 1,
        })
      }
    }

    const averageTimePerStage: AverageTimePerStage[] = Array.from(roleTimeTotals.entries())
      .map(([role, data]) => ({
        stage: roleLabels[role] || role,
        avgDays: Math.round((data.total / data.count / 86400) * 10) / 10, // Convert seconds to days
      }))
      .filter((s) => s.avgDays > 0)

    // Calculate articles by stage
    const stageCounts = new Map<string, number>()
    for (const article of allArticles) {
      const current = stageCounts.get(article.stage) || 0
      stageCounts.set(article.stage, current + 1)
    }
    const articlesByStage: ArticlesByStage[] = Array.from(stageCounts.entries()).map(
      ([stage, count]) => ({
        stage,
        count,
      })
    )

    // Calculate overview stats
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const publishedThisMonth = allArticles.filter((a) => {
      if (a.stage !== 'published' || !a.published_at) return false
      const publishDate = new Date(a.published_at)
      return publishDate.getMonth() === currentMonth && publishDate.getFullYear() === currentYear
    }).length

    const reportData: ReportsData = {
      articlesByMonth,
      articlesByClient,
      articlesByType,
      averageTimePerStage,
      articlesByStage,
      overview: {
        totalArticles: allArticles.length,
        publishedThisMonth,
        totalCompanies: allCompanies.length,
        totalKeywords: allKeywords.length,
        usedKeywords: allKeywords.filter((k) => k.is_used).length,
      },
    }

    return NextResponse.json({ data: reportData })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
