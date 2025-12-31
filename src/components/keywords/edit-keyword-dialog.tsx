'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { useToast } from '@/hooks/use-toast'

interface Keyword {
  id: string
  keyword_text: string
  suggested_title: string | null
  content_type: 'seo' | 'blog'
  month_year: string
  notes?: string | null
  company_id: string
  companies: {
    id: string
    name: string
    slug: string
  }
}

interface EditKeywordDialogProps {
  keyword: Keyword | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function EditKeywordDialog({
  keyword,
  open,
  onOpenChange,
  onUpdated,
}: EditKeywordDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [keywordText, setKeywordText] = useState('')
  const [contentType, setContentType] = useState<'seo' | 'blog'>('seo')
  const [monthYear, setMonthYear] = useState('')
  const [notes, setNotes] = useState('')

  // Reset form when keyword changes
  useEffect(() => {
    if (keyword) {
      setKeywordText(keyword.keyword_text)
      setContentType(keyword.content_type)
      setMonthYear(keyword.month_year)
      setNotes(keyword.notes || '')
    }
  }, [keyword])

  // Generate month options
  const getMonthOptions = () => {
    const options: string[] = []
    const now = new Date()
    for (let i = -6; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      const year = date.getFullYear().toString().slice(-2)
      options.push(`${month}${year}`)
    }
    return options
  }

  const handleUpdate = async () => {
    if (!keyword) return

    if (!keywordText.trim()) {
      toast({
        title: 'Missing field',
        description: 'Keyword text is required',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/keywords/${keyword.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_text: keywordText.trim(),
          content_type: contentType,
          month_year: monthYear,
          notes: notes.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: 'Keyword updated',
        description: `"${keywordText}" has been updated`,
      })
      onOpenChange(false)
      onUpdated?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update keyword',
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
          <DialogTitle>Edit Keyword</DialogTitle>
          <DialogDescription>
            Update the keyword details. Company cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Company</Label>
            <Badge variant="outline">{keyword.companies.name}</Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywordText">Keyword *</Label>
            <Input
              id="keywordText"
              placeholder="Enter keyword"
              value={keywordText}
              onChange={(e) => setKeywordText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Content Type *</Label>
              <Select
                value={contentType}
                onValueChange={(v) => setContentType(v as 'seo' | 'blog')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTENT_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Month *</Label>
              <Select value={monthYear} onValueChange={setMonthYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this keyword"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
