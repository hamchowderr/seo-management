'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { useToast } from '@/hooks/use-toast'

interface Keyword {
  id: string
  keyword_text: string
  suggested_title: string | null
  content_type: 'seo' | 'blog'
  month_year: string
  company_id: string
  companies: {
    id: string
    name: string
    slug: string
  }
}

interface ConvertKeywordDialogProps {
  keyword: Keyword | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConverted?: () => void
}

export function ConvertKeywordDialog({
  keyword,
  open,
  onOpenChange,
  onConverted,
}: ConvertKeywordDialogProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset title when keyword changes
  useState(() => {
    if (keyword) {
      setTitle(keyword.suggested_title || '')
    }
  })

  const handleConvert = async () => {
    if (!keyword) return

    setLoading(true)
    try {
      const response = await fetch(`/api/keywords/${keyword.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || keyword.keyword_text,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: 'Article created',
        description: `"${data.data.title}" has been created and is ready for writing`,
      })
      onConverted?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to convert keyword',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!keyword) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Article</DialogTitle>
          <DialogDescription>
            This will create a new article from this keyword and mark it as used.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Keyword</Label>
            <p className="font-medium">{keyword.keyword_text}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{keyword.companies.name}</Badge>
            <Badge
              variant="outline"
              style={{
                borderColor: CONTENT_TYPES[keyword.content_type].color,
                color: CONTENT_TYPES[keyword.content_type].color,
              }}
            >
              {CONTENT_TYPES[keyword.content_type].label}
            </Badge>
            <span className="text-muted-foreground text-sm">{keyword.month_year}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Article Title</Label>
            <Input
              id="title"
              placeholder="Enter article title (or leave empty to use keyword)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              If left empty, the keyword will be used as the title.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
