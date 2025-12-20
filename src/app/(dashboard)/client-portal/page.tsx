'use client'

import Link from 'next/link'
import { FileText, CheckCircle2, Clock, ExternalLink, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useArticles } from '@/hooks/queries'

export default function ClientPortalPage() {
  const { data: articlesData, isLoading: loading } = useArticles({ limit: 100 })
  const articles = articlesData?.data || []

  const publishedArticles = articles.filter((a) => a.stage === 'published')
  const inProgressArticles = articles.filter((a) => a.stage !== 'published')
  const recentPublished = publishedArticles.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">
          Track the progress of your content and view published articles.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressArticles.length}</div>
            <p className="text-muted-foreground text-xs">Articles being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedArticles.length}</div>
            <p className="text-muted-foreground text-xs">Live on your website</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Published</CardTitle>
            <CardDescription>Your latest published articles</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPublished.length === 0 ? (
              <p className="text-muted-foreground text-sm">No published articles yet</p>
            ) : (
              <div className="space-y-3">
                {recentPublished.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{article.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {article.month_year} • {article.content_type.toUpperCase()}
                      </p>
                    </div>
                    {article.published_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={article.published_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {publishedArticles.length > 5 && (
              <Button variant="link" className="mt-4 p-0" asChild>
                <Link href="/client-portal/archive">
                  View all in archive
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currently In Progress</CardTitle>
            <CardDescription>Articles being worked on</CardDescription>
          </CardHeader>
          <CardContent>
            {inProgressArticles.length === 0 ? (
              <p className="text-muted-foreground text-sm">No articles in progress</p>
            ) : (
              <div className="space-y-3">
                {inProgressArticles.slice(0, 5).map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{article.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {article.month_year} • {article.content_type.toUpperCase()}
                      </p>
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                ))}
              </div>
            )}
            {inProgressArticles.length > 5 && (
              <Button variant="link" className="mt-4 p-0" asChild>
                <Link href="/client-portal/articles">
                  View all articles
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
