'use client'

import { useState, useMemo } from 'react'
import { Filter, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArticleList } from '@/components/articles/article-list'
import { STAGE_LABELS, WORKFLOW_STAGES } from '@/lib/constants/stages'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { useArticles, useCompanies } from '@/hooks/queries'

export default function ArticlesPage() {
  // Filters
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [stageFilter, setStageFilter] = useState<string>('')
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const limit = 20

  const filters = useMemo(
    () => ({
      companyId: companyFilter && companyFilter !== 'all' ? companyFilter : undefined,
      stage: stageFilter && stageFilter !== 'all' ? stageFilter : undefined,
      contentType: contentTypeFilter && contentTypeFilter !== 'all' ? contentTypeFilter : undefined,
      monthYear: monthFilter && monthFilter !== 'all' ? monthFilter : undefined,
      page,
      limit,
    }),
    [companyFilter, stageFilter, contentTypeFilter, monthFilter, page]
  )

  const {
    data: articlesData,
    isLoading: loading,
    refetch,
  } = useArticles(filters, { polling: true })
  const { data: companies = [] } = useCompanies()

  const articles = articlesData?.data || []
  const pagination = articlesData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }

  // Get unique months from database
  const getMonthOptions = () => {
    const months = new Set<string>()
    // Generate last 12 months
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      const year = date.getFullYear().toString().slice(-2)
      months.add(`${month}${year}`)
    }
    return Array.from(months)
  }

  const clearFilters = () => {
    setCompanyFilter('')
    setStageFilter('')
    setContentTypeFilter('')
    setMonthFilter('')
    setPage(1)
  }

  const hasFilters = companyFilter || stageFilter || contentTypeFilter || monthFilter

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">Manage all articles in the workflow.</p>
        </div>
        <Button asChild className="min-h-[44px] w-full sm:w-auto">
          <a href="/keywords">
            <Plus className="mr-2 h-4 w-4" />
            Create from Keyword
          </a>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex shrink-0 items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="min-h-[44px] w-full sm:w-[180px]">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="min-h-[44px] w-full sm:w-[180px]">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {WORKFLOW_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
            <SelectTrigger className="min-h-[44px] w-full sm:w-[140px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(CONTENT_TYPES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="min-h-[44px] w-full sm:w-[140px]">
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {getMonthOptions().map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Articles</CardTitle>
              <CardDescription>{pagination.total} articles found</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
            </div>
          ) : (
            <>
              <ArticleList
                articles={articles as Parameters<typeof ArticleList>[0]['articles']}
                onRefresh={() => refetch()}
              />

              {pagination.totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground text-center text-sm sm:text-left">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} articles
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] flex-1 sm:flex-none"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] flex-1 sm:flex-none"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
