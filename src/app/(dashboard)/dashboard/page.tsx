import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  FileText,
  Hash,
  CheckCircle,
  Clock,
  ArrowRight,
  Building2,
  Users,
  Plus,
  LayoutDashboard,
} from 'lucide-react'
import { STAGE_LABELS, STAGE_COLORS, type ArticleStage } from '@/lib/constants/stages'
import { ArticlesByStageChart } from '@/components/dashboard/articles-by-stage-chart'
import { SearchTrigger } from '@/components/search-trigger'

export default async function DashboardPage() {
  // Check if user is a client - redirect to client portal
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (user) {
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'client') {
      redirect('/client-portal')
    }
  }

  const supabase = createAdminClient()

  // Get article counts by stage
  const { data: articles } = await supabase
    .from('articles')
    .select('id, stage, title, full_title, content_type, updated_at, companies(name)')
    .order('updated_at', { ascending: false })

  const { data: keywords } = await supabase
    .from('keywords')
    .select('id, keyword_text, is_used, companies(name)')
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: companies } = await supabase.from('companies').select('id').eq('is_active', true)

  const { data: users } = await supabase.from('users').select('id')

  const { data: recentHistory } = await supabase
    .from('article_history')
    .select(
      `
      id,
      action,
      from_stage,
      to_stage,
      created_at,
      articles (
        id,
        title,
        full_title
      ),
      users (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(10)

  const stats = {
    totalArticles: articles?.length || 0,
    published: articles?.filter((a) => a.stage === 'published').length || 0,
    inProgress:
      articles?.filter((a) => a.stage !== 'published' && a.stage !== 'keyword_hopper').length || 0,
    availableKeywords: keywords?.length || 0,
    companies: companies?.length || 0,
    users: users?.length || 0,
  }

  const stageBreakdown =
    articles?.reduce(
      (acc, article) => {
        acc[article.stage] = (acc[article.stage] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    ) || {}

  const recentArticles = articles?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to SEO Monster. Here&apos;s an overview of your content pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/keywords">
              <Plus className="mr-2 h-4 w-4" />
              Add Keyword
            </Link>
          </Button>
          <Button asChild>
            <Link href="/board">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              View Board
            </Link>
          </Button>
        </div>
      </div>

      <SearchTrigger />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
            <p className="text-muted-foreground text-xs">Across all stages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-muted-foreground text-xs">Live on websites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-muted-foreground text-xs">Currently in workflow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Keywords</CardTitle>
            <Hash className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.availableKeywords}</div>
            <p className="text-muted-foreground text-xs">In keyword hopper</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Stage Breakdown</CardTitle>
            <CardDescription>Articles by workflow stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ArticlesByStageChart
              stageBreakdown={stageBreakdown}
              totalArticles={stats.totalArticles}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Stats</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Companies</span>
              </div>
              <span className="font-medium">{stats.companies}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Team Members</span>
              </div>
              <span className="font-medium">{stats.users}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Articles</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/articles">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="hover:bg-muted flex items-center justify-between rounded-lg p-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {article.full_title || article.title}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {(article.companies as unknown as { name: string } | null)?.name}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="ml-2"
                    style={{
                      backgroundColor: `${STAGE_COLORS[article.stage as ArticleStage]}20`,
                      color: STAGE_COLORS[article.stage as ArticleStage],
                    }}
                  >
                    {STAGE_LABELS[article.stage as ArticleStage]}
                  </Badge>
                </Link>
              ))}
              {recentArticles.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">No articles yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentHistory?.map((item) => {
                const user = item.users as unknown as {
                  full_name: string
                  avatar_url: string
                } | null
                return (
                  <div key={item.id} className="flex items-start gap-3 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {(user?.full_name || 'U')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{user?.full_name || 'Unknown'}</span>{' '}
                        {item.action === 'stage_change' ? (
                          <>moved an article</>
                        ) : item.action === 'created' ? (
                          <>created an article</>
                        ) : item.action === 'assignment' ? (
                          <>assigned a user</>
                        ) : (
                          <>{item.action}</>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                )
              })}

              {(!recentHistory || recentHistory.length === 0) && (
                <p className="text-muted-foreground py-4 text-center text-sm">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(keywords?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Keywords Ready for Conversion</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/keywords">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {keywords?.map((keyword) => (
                <div
                  key={keyword.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{keyword.keyword_text}</p>
                    <p className="text-muted-foreground text-xs">
                      {(keyword.companies as unknown as { name: string } | null)?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
