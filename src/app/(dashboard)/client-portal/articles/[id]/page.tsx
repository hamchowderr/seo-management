'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  ExternalLink,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { queryKeys } from '@/hooks/queries'

interface Article {
  id: string
  title: string
  full_title: string
  content_type: 'seo' | 'blog'
  article_number: number
  month_year: string
  stage: string
  published_url: string | null
  published_at: string | null
  created_at: string
  companies: {
    id: string
    name: string
  }
}

export default function ClientArticleDetailPage() {
  const params = useParams()
  const articleId = params.id as string

  const {
    data: article,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.article(articleId),
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}`)
      if (!response.ok) {
        throw new Error('Article not found')
      }
      const data = await response.json()
      return data.data as Article
    },
    retry: false,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">Article not found</h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'Failed to load article'}
        </p>
        <Button asChild>
          <Link href="/client-portal/articles">Back to Articles</Link>
        </Button>
      </div>
    )
  }

  const isPublished = article.stage === 'published'
  const simplifiedStatus = isPublished ? 'Published' : 'In Progress'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/client-portal/articles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline">{article.content_type.toUpperCase()}</Badge>
            <Badge
              variant={isPublished ? 'default' : 'secondary'}
              className={isPublished ? 'bg-green-100 text-green-800' : ''}
            >
              {isPublished ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {simplifiedStatus}
                </>
              ) : (
                <>
                  <Clock className="mr-1 h-3 w-3" />
                  {simplifiedStatus}
                </>
              )}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{article.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{article.companies.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Month:</span>
                  <span className="font-medium">{article.month_year}</span>
                </div>
              </div>

              {article.full_title && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Full Title:</span>
                    <p className="mt-1 font-medium">{article.full_title}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isPublished && article.published_url && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  Published Article
                </CardTitle>
                <CardDescription>This article is live on your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Published on:</span>{' '}
                    <span className="font-medium">
                      {article.published_at
                        ? format(new Date(article.published_at), 'MMMM d, yyyy')
                        : 'Unknown'}
                    </span>
                  </div>
                  <Button asChild className="w-full sm:w-auto">
                    <a href={article.published_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Published Article
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {isPublished ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Published</p>
                      <p className="text-muted-foreground text-sm">Live on your website</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">In Progress</p>
                      <p className="text-muted-foreground text-sm">Being worked on by our team</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="bg-muted-foreground h-2 w-2 rounded-full" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                </div>
                {article.published_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Published:</span>
                    <span>{format(new Date(article.published_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
