'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, MoreHorizontal, Trash2, FileText, ExternalLink, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConvertKeywordDialog } from './convert-keyword-dialog'
import { EditKeywordDialog } from './edit-keyword-dialog'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { STAGE_LABELS, STAGE_COLORS, type ArticleStage } from '@/lib/constants/stages'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface Keyword {
  id: string
  keyword_text: string
  suggested_title: string | null
  content_type: 'seo' | 'blog'
  month_year: string
  notes?: string | null
  is_used: boolean
  used_at: string | null
  company_id: string
  companies: {
    id: string
    name: string
    slug: string
  }
  articles?: Array<{
    id: string
    title: string
    stage: ArticleStage
  }>
}

interface KeywordListProps {
  keywords: Keyword[]
  showUsed?: boolean
  onRefresh?: () => void
}

export function KeywordList({ keywords, showUsed = false, onRefresh }: KeywordListProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [convertingKeyword, setConvertingKeyword] = useState<Keyword | null>(null)
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (keyword: Keyword) => {
    if (keyword.is_used) {
      toast({
        title: 'Cannot delete',
        description: 'Cannot delete a keyword that has been converted to an article',
        variant: 'destructive',
      })
      return
    }

    setDeletingId(keyword.id)
    try {
      const response = await fetch(`/api/keywords/${keyword.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      toast({
        title: 'Keyword deleted',
        description: `"${keyword.keyword_text}" has been deleted`,
      })
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete keyword',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredKeywords = showUsed
    ? keywords.filter((k) => k.is_used)
    : keywords.filter((k) => !k.is_used)

  if (filteredKeywords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-muted-foreground">
          {showUsed ? 'No used keywords yet.' : 'No available keywords. Add some to get started.'}
        </p>
      </div>
    )
  }

  // Mobile card view
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {filteredKeywords.map((keyword) => (
            <Card key={keyword.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'line-clamp-2 font-medium',
                      keyword.is_used && 'text-muted-foreground line-through'
                    )}
                  >
                    {keyword.keyword_text}
                  </p>
                  {keyword.suggested_title && (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {keyword.suggested_title}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {keyword.companies.name}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: CONTENT_TYPES[keyword.content_type].color,
                        color: CONTENT_TYPES[keyword.content_type].color,
                      }}
                    >
                      {CONTENT_TYPES[keyword.content_type].label}
                    </Badge>
                    <span className="text-muted-foreground px-2 py-0.5 text-xs">
                      {keyword.month_year}
                    </span>
                  </div>
                  {showUsed && keyword.used_at && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Used: {new Date(keyword.used_at).toLocaleDateString()}
                    </p>
                  )}
                  {showUsed && keyword.articles && keyword.articles.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Link
                        href={`/articles/${keyword.articles[0].id}`}
                        className="text-primary flex items-center gap-1 text-xs hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Article
                      </Link>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${STAGE_COLORS[keyword.articles[0].stage]}20`,
                          color: STAGE_COLORS[keyword.articles[0].stage],
                        }}
                      >
                        {STAGE_LABELS[keyword.articles[0].stage]}
                      </Badge>
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!keyword.is_used && (
                      <>
                        <DropdownMenuItem onClick={() => setEditingKeyword(keyword)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setConvertingKeyword(keyword)}>
                          <Check className="mr-2 h-4 w-4" />
                          Convert to Article
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(keyword)}
                      disabled={keyword.is_used || deletingId === keyword.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>

        <ConvertKeywordDialog
          keyword={convertingKeyword}
          open={!!convertingKeyword}
          onOpenChange={(open) => {
            if (!open) setConvertingKeyword(null)
          }}
          onConverted={() => {
            setConvertingKeyword(null)
            onRefresh?.()
          }}
        />

        <EditKeywordDialog
          keyword={editingKeyword}
          open={!!editingKeyword}
          onOpenChange={(open) => {
            if (!open) setEditingKeyword(null)
          }}
          onUpdated={() => {
            setEditingKeyword(null)
            onRefresh?.()
          }}
        />
      </>
    )
  }

  // Desktop table view
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Month</TableHead>
            {showUsed && <TableHead>Used</TableHead>}
            {showUsed && <TableHead>Article</TableHead>}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredKeywords.map((keyword) => (
            <TableRow key={keyword.id}>
              <TableCell>
                <div>
                  <p
                    className={cn(
                      'font-medium',
                      keyword.is_used && 'text-muted-foreground line-through'
                    )}
                  >
                    {keyword.keyword_text}
                  </p>
                  {keyword.suggested_title && (
                    <p className="text-muted-foreground mt-1 text-xs">{keyword.suggested_title}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{keyword.companies.name}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: CONTENT_TYPES[keyword.content_type].color,
                    color: CONTENT_TYPES[keyword.content_type].color,
                  }}
                >
                  {CONTENT_TYPES[keyword.content_type].label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{keyword.month_year}</TableCell>
              {showUsed && (
                <TableCell className="text-muted-foreground text-sm">
                  {keyword.used_at ? new Date(keyword.used_at).toLocaleDateString() : '-'}
                </TableCell>
              )}
              {showUsed && (
                <TableCell>
                  {keyword.articles && keyword.articles.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/articles/${keyword.articles[0].id}`}
                        className="text-primary flex items-center gap-1 text-sm hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Link>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${STAGE_COLORS[keyword.articles[0].stage]}20`,
                          color: STAGE_COLORS[keyword.articles[0].stage],
                        }}
                      >
                        {STAGE_LABELS[keyword.articles[0].stage]}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!keyword.is_used && (
                      <>
                        <DropdownMenuItem onClick={() => setEditingKeyword(keyword)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setConvertingKeyword(keyword)}>
                          <Check className="mr-2 h-4 w-4" />
                          Convert to Article
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(keyword)}
                      disabled={keyword.is_used || deletingId === keyword.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConvertKeywordDialog
        keyword={convertingKeyword}
        open={!!convertingKeyword}
        onOpenChange={(open) => {
          if (!open) setConvertingKeyword(null)
        }}
        onConverted={() => {
          setConvertingKeyword(null)
          onRefresh?.()
        }}
      />

      <EditKeywordDialog
        keyword={editingKeyword}
        open={!!editingKeyword}
        onOpenChange={(open) => {
          if (!open) setEditingKeyword(null)
        }}
        onUpdated={() => {
          setEditingKeyword(null)
          onRefresh?.()
        }}
      />
    </>
  )
}
