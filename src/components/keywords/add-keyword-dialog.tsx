'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/client'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { useToast } from '@/hooks/use-toast'

interface Company {
  id: string
  name: string
}

interface AddKeywordDialogProps {
  onAdded?: () => void
  children?: React.ReactNode
}

export function AddKeywordDialog({ onAdded, children }: AddKeywordDialogProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [open, setOpen] = useState(false)

  // Listen for command menu trigger
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open:add-keyword', handleOpen)
    return () => window.removeEventListener('open:add-keyword', handleOpen)
  }, [])
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])

  // Single keyword form state
  const [keyword, setKeyword] = useState('')
  const [suggestedTitle, setSuggestedTitle] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [contentType, setContentType] = useState<'seo' | 'blog'>('seo')
  const [monthYear, setMonthYear] = useState('')

  // Bulk keywords form state
  const [bulkKeywords, setBulkKeywords] = useState('')
  const [bulkCompanyId, setBulkCompanyId] = useState('')
  const [bulkContentType, setBulkContentType] = useState<'seo' | 'blog'>('seo')
  const [bulkMonthYear, setBulkMonthYear] = useState('')

  useEffect(() => {
    if (open) {
      const fetchCompanies = async () => {
        const { data } = await supabase
          .from('companies')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
        setCompanies(data || [])
      }
      fetchCompanies()

      // Set default month to current
      const now = new Date()
      const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      const year = now.getFullYear().toString().slice(-2)
      const defaultMonth = `${month}${year}`
      setMonthYear(defaultMonth)
      setBulkMonthYear(defaultMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is a singleton
  }, [open])

  const resetForm = () => {
    setKeyword('')
    setSuggestedTitle('')
    setCompanyId('')
    setContentType('seo')
    setBulkKeywords('')
    setBulkCompanyId('')
    setBulkContentType('seo')
  }

  const handleAddSingle = async () => {
    if (!keyword.trim() || !companyId || !monthYear) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword_text: keyword.trim(),
          suggested_title: suggestedTitle.trim() || null,
          company_id: companyId,
          content_type: contentType,
          month_year: monthYear,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: 'Keyword added',
        description: `"${keyword}" has been added to the hopper`,
      })
      resetForm()
      setOpen(false)
      onAdded?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add keyword',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddBulk = async () => {
    const keywords = bulkKeywords
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    if (keywords.length === 0 || !bulkCompanyId || !bulkMonthYear) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.map((k) => ({
            keyword_text: k,
            company_id: bulkCompanyId,
            content_type: bulkContentType,
            month_year: bulkMonthYear,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: 'Keywords added',
        description: `${keywords.length} keywords have been added to the hopper`,
      })
      resetForm()
      setOpen(false)
      onAdded?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add keywords',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate month options
  const getMonthOptions = () => {
    const options: string[] = []
    const now = new Date()
    for (let i = -2; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      const year = date.getFullYear().toString().slice(-2)
      options.push(`${month}${year}`)
    }
    return options
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Keyword
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Keywords</DialogTitle>
          <DialogDescription>
            Add keywords to the hopper that will be converted to articles.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Keyword</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword *</Label>
              <Input
                id="keyword"
                placeholder="Enter keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestedTitle">Suggested Title</Label>
              <Input
                id="suggestedTitle"
                placeholder="Optional article title suggestion"
                value={suggestedTitle}
                onChange={(e) => setSuggestedTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company *</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSingle} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Keyword
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkKeywords">Keywords *</Label>
              <Textarea
                id="bulkKeywords"
                placeholder="Enter one keyword per line"
                rows={6}
                value={bulkKeywords}
                onChange={(e) => setBulkKeywords(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                {bulkKeywords.split('\n').filter((k) => k.trim()).length} keywords
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company *</Label>
                <Select value={bulkCompanyId} onValueChange={setBulkCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Content Type *</Label>
                <Select
                  value={bulkContentType}
                  onValueChange={(v) => setBulkContentType(v as 'seo' | 'blog')}
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
            </div>

            <div className="space-y-2">
              <Label>Month *</Label>
              <Select value={bulkMonthYear} onValueChange={setBulkMonthYear}>
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBulk} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add {bulkKeywords.split('\n').filter((k) => k.trim()).length} Keywords
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
