'use client'

import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import {
  FileText,
  ExternalLink,
  Calendar,
  ChevronDown,
  ChevronRight,
  FolderArchive,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useArticles, useCompanies, type Article } from '@/hooks/queries'

interface MonthGroup {
  monthYear: string
  displayName: string
  articles: Article[]
}

export default function ClientArchivePage() {
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set())

  // Fetch published articles with large limit
  const { data: articlesData, isLoading: loading } = useArticles({
    limit: 1000,
    stage: 'published',
  })
  const { data: companies = [] } = useCompanies()

  const articles = useMemo(() => (articlesData?.data || []) as Article[], [articlesData?.data])

  // Auto-expand the first month when articles load
  useEffect(() => {
    if (articles.length > 0 && openMonths.size === 0) {
      const firstMonth = articles[0].month_year
      setOpenMonths(new Set([firstMonth]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when articles change, not openMonths
  }, [articles])

  // Filter and group articles by month
  const groupedArticles = useMemo(() => {
    const filtered = articles.filter(
      (a) => companyFilter === 'all' || a.companies?.id === companyFilter
    )

    // Group by month_year
    const groups: Record<string, Article[]> = {}
    filtered.forEach((article) => {
      if (!groups[article.month_year]) {
        groups[article.month_year] = []
      }
      groups[article.month_year].push(article)
    })

    // Convert to array and sort by month_year descending
    const monthGroups: MonthGroup[] = Object.entries(groups)
      .map(([monthYear, arts]) => ({
        monthYear,
        displayName: formatMonthYear(monthYear),
        articles: arts.sort(
          (a, b) =>
            new Date(b.published_at || b.created_at || 0).getTime() -
            new Date(a.published_at || a.created_at || 0).getTime()
        ),
      }))
      .sort((a, b) => {
        // Sort by month_year descending (newer first)
        const [aMonth, aYear] = parseMonthYear(a.monthYear)
        const [bMonth, bYear] = parseMonthYear(b.monthYear)
        if (aYear !== bYear) return bYear - aYear
        return bMonth - aMonth
      })

    return monthGroups
  }, [articles, companyFilter])

  const toggleMonth = (monthYear: string) => {
    const newOpen = new Set(openMonths)
    if (newOpen.has(monthYear)) {
      newOpen.delete(monthYear)
    } else {
      newOpen.add(monthYear)
    }
    setOpenMonths(newOpen)
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Document Archive</h1>
        <p className="text-muted-foreground">Browse all published articles organized by month.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {companies.length > 1 && (
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="text-muted-foreground text-sm">
          {articles.length} published {articles.length === 1 ? 'article' : 'articles'}
        </div>
      </div>

      {/* Archive List */}
      {groupedArticles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderArchive className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">No published articles yet</h3>
            <p className="text-muted-foreground">
              Published articles will appear here organized by month.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedArticles.map((group) => (
            <Collapsible
              key={group.monthYear}
              open={openMonths.has(group.monthYear)}
              onOpenChange={() => toggleMonth(group.monthYear)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                          <Calendar className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{group.displayName}</CardTitle>
                          <CardDescription>
                            {group.articles.length}{' '}
                            {group.articles.length === 1 ? 'article' : 'articles'}
                          </CardDescription>
                        </div>
                      </div>
                      {openMonths.has(group.monthYear) ? (
                        <ChevronDown className="text-muted-foreground h-5 w-5" />
                      ) : (
                        <ChevronRight className="text-muted-foreground h-5 w-5" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {group.articles.map((article) => (
                        <div
                          key={article.id}
                          className="bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <FileText className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{article.title}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {article.content_type.toUpperCase()}
                                </Badge>
                                <span className="text-muted-foreground text-xs">
                                  {article.companies?.name}
                                </span>
                                {article.published_at && (
                                  <span className="text-muted-foreground text-xs">
                                    • {format(new Date(article.published_at), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {article.published_url ? (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={article.published_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View
                              </a>
                            </Button>
                          ) : (
                            <Badge variant="secondary">No URL</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper functions
function formatMonthYear(monthYear: string): string {
  // Convert "DEC24" to "December 2024"
  const months: Record<string, string> = {
    JAN: 'January',
    FEB: 'February',
    MAR: 'March',
    APR: 'April',
    MAY: 'May',
    JUN: 'June',
    JUL: 'July',
    AUG: 'August',
    SEP: 'September',
    OCT: 'October',
    NOV: 'November',
    DEC: 'December',
  }

  const month = monthYear.slice(0, 3).toUpperCase()
  const year = monthYear.slice(3)
  const fullYear = year.length === 2 ? `20${year}` : year

  return `${months[month] || month} ${fullYear}`
}

function parseMonthYear(monthYear: string): [number, number] {
  const months: Record<string, number> = {
    JAN: 1,
    FEB: 2,
    MAR: 3,
    APR: 4,
    MAY: 5,
    JUN: 6,
    JUL: 7,
    AUG: 8,
    SEP: 9,
    OCT: 10,
    NOV: 11,
    DEC: 12,
  }

  const month = monthYear.slice(0, 3).toUpperCase()
  const year = monthYear.slice(3)
  const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year)

  return [months[month] || 0, fullYear]
}
