'use client'

import { useState } from 'react'
import { FileText, Building2, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReports } from '@/hooks/queries/use-reports'
import { useCompanies } from '@/hooks/queries'
import { ArticlesByMonthChart } from '@/components/reports/articles-by-month-chart'
import { ArticlesByClientChart } from '@/components/reports/articles-by-client-chart'
import { ArticlesByTypeChart } from '@/components/reports/articles-by-type-chart'
import { AverageTimeChart } from '@/components/reports/average-time-chart'
import { STAGE_LABELS, WORKFLOW_STAGES, type ArticleStage } from '@/lib/constants/stages'

export default function ReportsPage() {
  const [companyFilter, setCompanyFilter] = useState<string>('')

  const { data: companies = [] } = useCompanies()

  const {
    data: reports,
    isLoading,
    error,
  } = useReports(
    companyFilter && companyFilter !== 'all' ? { companyId: companyFilter } : undefined
  )

  // Stage colors for progress bars
  const stageColors: Record<ArticleStage, string> = {
    keyword_hopper: 'bg-gray-500',
    needs_writing: 'bg-blue-500',
    ready_for_editing: 'bg-yellow-500',
    ready_for_approval: 'bg-purple-500',
    assigned_for_posting: 'bg-orange-500',
    published: 'bg-green-500',
  }

  const keywordConversionRate =
    reports?.overview.totalKeywords && reports.overview.totalKeywords > 0
      ? Math.round((reports.overview.usedKeywords / reports.overview.totalKeywords) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your content production.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="min-h-[44px] w-full sm:w-[200px]">
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-destructive">Failed to load reports</p>
        </div>
      ) : reports ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                <FileText className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.overview.totalArticles}</div>
                <p className="text-muted-foreground text-xs">Across all stages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published This Month</CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.overview.publishedThisMonth}</div>
                <p className="text-muted-foreground text-xs">Articles published</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Keywords</CardTitle>
                <TrendingUp className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.overview.totalKeywords}</div>
                <p className="text-muted-foreground text-xs">
                  {reports.overview.usedKeywords} converted ({keywordConversionRate}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Companies</CardTitle>
                <Building2 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.overview.totalCompanies}</div>
                <p className="text-muted-foreground text-xs">Active clients</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Articles by Month - Full Width */}
            <div className="lg:col-span-2">
              <ArticlesByMonthChart data={reports.articlesByMonth} />
            </div>

            {/* Articles by Client */}
            <ArticlesByClientChart data={reports.articlesByClient} />

            {/* Articles by Type */}
            <ArticlesByTypeChart data={reports.articlesByType} />

            {/* Average Time per Stage */}
            <AverageTimeChart data={reports.averageTimePerStage} />

            {/* Articles by Stage - Progress Bars */}
            <Card>
              <CardHeader>
                <CardTitle>Articles by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {WORKFLOW_STAGES.map((stage) => {
                    const stageData = reports.articlesByStage.find((s) => s.stage === stage)
                    const count = stageData?.count || 0
                    const percentage =
                      reports.overview.totalArticles > 0
                        ? Math.round((count / reports.overview.totalArticles) * 100)
                        : 0

                    return (
                      <div key={stage} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{STAGE_LABELS[stage]}</span>
                          <span className="text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="bg-secondary h-2 overflow-hidden rounded-full">
                          <div
                            className={`h-full ${stageColors[stage]} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
