'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, ExternalLink, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useArticles, useCompanies } from '@/hooks/queries'

export default function ClientArticlesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  const { data: articlesData, isLoading: articlesLoading } = useArticles({ limit: 500 })
  const { data: companies = [], isLoading: companiesLoading } = useCompanies()

  const articles = articlesData?.data || []
  const loading = articlesLoading || companiesLoading

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.full_title?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && article.stage === 'published') ||
      (statusFilter === 'in_progress' && article.stage !== 'published')

    const matchesCompany = companyFilter === 'all' || article.companies?.id === companyFilter

    return matchesSearch && matchesStatus && matchesCompany
  })

  const getSimplifiedStatus = (stage: string) => {
    return stage === 'published' ? 'Published' : 'In Progress'
  }

  const getStatusVariant = (stage: string): 'default' | 'secondary' => {
    return stage === 'published' ? 'default' : 'secondary'
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
        <h1 className="text-3xl font-bold tracking-tight">My Articles</h1>
        <p className="text-muted-foreground">View all articles being created for your company.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          {companies.length > 1 && (
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Company" />
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
        </div>
      </div>

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold">No articles found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || companyFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Articles will appear here once created'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <Link
                        href={`/client-portal/articles/${article.id}`}
                        className="font-medium hover:underline"
                      >
                        {article.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {article.companies?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{article.content_type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{article.month_year}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(article.stage)}
                        className={
                          article.stage === 'published'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : ''
                        }
                      >
                        {getSimplifiedStatus(article.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {article.published_url ? (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={article.published_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
