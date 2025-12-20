'use client'

import { useState, useMemo } from 'react'
import { Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { KeywordList } from '@/components/keywords/keyword-list'
import { AddKeywordDialog } from '@/components/keywords/add-keyword-dialog'
import { ImportCSVDialog } from '@/components/keywords/import-csv-dialog'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { useKeywords, useCompanies } from '@/hooks/queries'

interface Keyword {
  id: string
  keyword_text: string
  suggested_title: string | null
  content_type: 'seo' | 'blog'
  month_year: string
  is_used: boolean
  used_at: string | null
  company_id: string
  companies: {
    id: string
    name: string
    slug: string
  }
}

export default function KeywordsPage() {
  // Filters
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>('')

  const filters = useMemo(
    () => ({
      companyId: companyFilter && companyFilter !== 'all' ? companyFilter : undefined,
      contentType: contentTypeFilter && contentTypeFilter !== 'all' ? contentTypeFilter : undefined,
      monthYear: monthFilter && monthFilter !== 'all' ? monthFilter : undefined,
    }),
    [companyFilter, contentTypeFilter, monthFilter]
  )

  const {
    data: keywordsData = [],
    isLoading: loading,
    refetch,
  } = useKeywords(filters, { polling: true })
  const { data: companies = [] } = useCompanies()

  const keywords = keywordsData as unknown as Keyword[]

  const availableKeywords = keywords.filter((k) => !k.is_used)
  const usedKeywords = keywords.filter((k) => k.is_used)

  // Get unique months from keywords
  const getMonthOptions = () => {
    const months = new Set<string>()
    keywords.forEach((k) => months.add(k.month_year))
    return Array.from(months).sort().reverse()
  }

  const clearFilters = () => {
    setCompanyFilter('')
    setContentTypeFilter('')
    setMonthFilter('')
  }

  const hasFilters = companyFilter || contentTypeFilter || monthFilter

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keyword Hopper</h1>
          <p className="text-muted-foreground">Manage keywords that will become articles.</p>
        </div>
        <div className="flex gap-2">
          <ImportCSVDialog onImported={() => refetch()} />
          <AddKeywordDialog onAdded={() => refetch()} />
        </div>
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

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger
            value="available"
            className="flex min-h-[44px] flex-1 items-center gap-2 sm:flex-none"
          >
            Available
            <Badge variant="secondary" className="ml-1">
              {availableKeywords.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="used"
            className="flex min-h-[44px] flex-1 items-center gap-2 sm:flex-none"
          >
            Used
            <Badge variant="secondary" className="ml-1">
              {usedKeywords.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Keywords</CardTitle>
              <CardDescription>
                Keywords ready to be converted into articles. Click the menu to convert or delete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                </div>
              ) : (
                <KeywordList keywords={keywords} showUsed={false} onRefresh={() => refetch()} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="used">
          <Card>
            <CardHeader>
              <CardTitle>Used Keywords</CardTitle>
              <CardDescription>Keywords that have been converted to articles.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                </div>
              ) : (
                <KeywordList keywords={keywords} showUsed={true} onRefresh={() => refetch()} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
