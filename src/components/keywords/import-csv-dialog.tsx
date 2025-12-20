'use client'

import { useState, useCallback } from 'react'
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useCompanies } from '@/hooks/queries'

interface ParsedKeyword {
  keyword_text: string
  content_type: 'blog' | 'seo'
  month_year: string
  status: 'valid' | 'invalid' | 'duplicate'
  error?: string
}

interface ColumnMapping {
  keyword: number
  content_type: number
  month_year: number
}

interface ImportCSVDialogProps {
  onImported?: (count: number) => void
}

const MONTH_YEAR_REGEX = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}$/

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    // Handle quoted values with commas
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })

  return { headers, rows }
}

function autoDetectColumns(headers: string[]): ColumnMapping | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase())

  const keywordIndex = lowerHeaders.findIndex((h) => h === 'keyword' || h === 'keyword_text')
  const typeIndex = lowerHeaders.findIndex((h) => h === 'content_type' || h === 'type')
  const monthIndex = lowerHeaders.findIndex((h) => h === 'month_year' || h === 'month')

  if (keywordIndex === -1) return null

  return {
    keyword: keywordIndex,
    content_type: typeIndex,
    month_year: monthIndex,
  }
}

type Step = 'upload' | 'map-columns' | 'preview'

export function ImportCSVDialog({ onImported }: ImportCSVDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [companyId, setCompanyId] = useState<string>('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    keyword: -1,
    content_type: -1,
    month_year: -1,
  })
  const [parsedKeywords, setParsedKeywords] = useState<ParsedKeyword[]>([])
  const [importing, setImporting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const { data: companies = [] } = useCompanies()

  const resetState = () => {
    setStep('upload')
    setCsvHeaders([])
    setCsvRows([])
    setColumnMapping({ keyword: -1, content_type: -1, month_year: -1 })
    setParsedKeywords([])
    setCompanyId('')
  }

  const processKeywords = useCallback((rows: string[][], mapping: ColumnMapping) => {
    const seen = new Set<string>()
    const keywords: ParsedKeyword[] = rows.map((row) => {
      const keyword_text = mapping.keyword >= 0 ? row[mapping.keyword]?.trim() || '' : ''
      const rawType =
        mapping.content_type >= 0 ? row[mapping.content_type]?.trim().toLowerCase() || 'seo' : 'seo'
      const month_year =
        mapping.month_year >= 0 ? row[mapping.month_year]?.trim().toUpperCase() || '' : ''

      // Validate
      const errors: string[] = []

      if (!keyword_text) {
        errors.push('Empty keyword')
      }

      if (rawType !== 'blog' && rawType !== 'seo') {
        errors.push(`Invalid type: ${rawType}`)
      }

      if (!MONTH_YEAR_REGEX.test(month_year)) {
        errors.push(`Invalid month: ${month_year}`)
      }

      const key = `${keyword_text}|${month_year}`
      const isDuplicate = seen.has(key)
      if (!isDuplicate && keyword_text) {
        seen.add(key)
      }

      const content_type = rawType === 'blog' ? 'blog' : 'seo'

      if (errors.length > 0) {
        return {
          keyword_text,
          content_type,
          month_year,
          status: 'invalid' as const,
          error: errors.join(', '),
        }
      }

      if (isDuplicate) {
        return {
          keyword_text,
          content_type,
          month_year,
          status: 'duplicate' as const,
          error: 'Duplicate in file',
        }
      }

      return {
        keyword_text,
        content_type,
        month_year,
        status: 'valid' as const,
      }
    })

    setParsedKeywords(keywords)
  }, [])

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const { headers, rows } = parseCSV(content)

        if (headers.length === 0) {
          toast.error('CSV file is empty')
          return
        }

        if (rows.length === 0) {
          toast.error('CSV has headers but no data rows')
          return
        }

        setCsvHeaders(headers)
        setCsvRows(rows)

        // Try auto-detection
        const detected = autoDetectColumns(headers)

        if (detected) {
          // Auto-detected - go straight to preview
          setColumnMapping(detected)
          processKeywords(rows, detected)
          setStep('preview')
          toast.success(`Found ${rows.length} rows`)
        } else {
          // Need manual mapping
          setColumnMapping({ keyword: -1, content_type: -1, month_year: -1 })
          setStep('map-columns')
        }
      }

      reader.readAsText(file)
    },
    [processKeywords]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleApplyMapping = () => {
    if (columnMapping.keyword === -1) {
      toast.error('Please select a column for keywords')
      return
    }
    if (columnMapping.month_year === -1) {
      toast.error('Please select a column for month/year')
      return
    }

    processKeywords(csvRows, columnMapping)
    setStep('preview')
  }

  const handleImport = async () => {
    if (!companyId) {
      toast.error('Please select a company')
      return
    }

    const validKeywords = parsedKeywords.filter((k) => k.status === 'valid')
    if (validKeywords.length === 0) {
      toast.error('No valid keywords to import')
      return
    }

    setImporting(true)
    try {
      const response = await fetch('/api/keywords/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          keywords: validKeywords.map((k) => ({
            keyword_text: k.keyword_text,
            content_type: k.content_type,
            month_year: k.month_year,
          })),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      toast.success(result.message)
      onImported?.(result.data.success)
      setOpen(false)
      resetState()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsedKeywords.filter((k) => k.status === 'valid').length
  const invalidCount = parsedKeywords.filter((k) => k.status === 'invalid').length
  const duplicateCount = parsedKeywords.filter((k) => k.status === 'duplicate').length

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetState()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Keywords from CSV</DialogTitle>
          <DialogDescription>
            {step === 'upload' &&
              'Upload a CSV file with columns: keyword, content_type (blog/seo), month_year (e.g., DEC25)'}
            {step === 'map-columns' && 'Map your CSV columns to the required fields'}
            {step === 'preview' && 'Review and confirm your import'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company Select - Always visible */}
          <div className="space-y-2">
            <Label>Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="min-h-[44px]">
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

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <FileText className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
              <p className="text-muted-foreground mb-2 text-sm">
                Drag and drop your CSV file here, or
              </p>
              <label>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                <Button variant="secondary" size="sm" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'map-columns' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Could not auto-detect columns. Your CSV has these columns:{' '}
                  <strong>{csvHeaders.join(', ')}</strong>. Please map them below.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>
                    Keyword Column <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={columnMapping.keyword >= 0 ? String(columnMapping.keyword) : ''}
                    onValueChange={(v) =>
                      setColumnMapping((prev) => ({ ...prev, keyword: parseInt(v) }))
                    }
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select column for keywords" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvHeaders.map((header, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {header}
                          <span className="text-muted-foreground ml-2 text-xs">
                            (e.g., &quot;{csvRows[0]?.[index]}&quot;)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Content Type Column (optional, defaults to &quot;seo&quot;)</Label>
                  <Select
                    value={
                      columnMapping.content_type >= 0 ? String(columnMapping.content_type) : 'none'
                    }
                    onValueChange={(v) =>
                      setColumnMapping((prev) => ({
                        ...prev,
                        content_type: v === 'none' ? -1 : parseInt(v),
                      }))
                    }
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (default to SEO)</SelectItem>
                      {csvHeaders.map((header, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {header}
                          <span className="text-muted-foreground ml-2 text-xs">
                            (e.g., &quot;{csvRows[0]?.[index]}&quot;)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Month/Year Column <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={columnMapping.month_year >= 0 ? String(columnMapping.month_year) : ''}
                    onValueChange={(v) =>
                      setColumnMapping((prev) => ({ ...prev, month_year: parseInt(v) }))
                    }
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select column for month/year" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvHeaders.map((header, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {header}
                          <span className="text-muted-foreground ml-2 text-xs">
                            (e.g., &quot;{csvRows[0]?.[index]}&quot;)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">Format: DEC25, JAN26, etc.</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleApplyMapping}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && parsedKeywords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {validCount} valid
                  </span>
                  {duplicateCount > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      {duplicateCount} duplicates
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-500" />
                      {invalidCount} invalid
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                  Upload different file
                </Button>
              </div>

              <ScrollArea className="h-[200px] rounded-md border">
                <div className="space-y-2 p-4">
                  {parsedKeywords.map((keyword, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between rounded p-2 text-sm ${
                        keyword.status === 'valid'
                          ? 'bg-green-50 dark:bg-green-950/20'
                          : keyword.status === 'duplicate'
                            ? 'bg-yellow-50 dark:bg-yellow-950/20'
                            : 'bg-red-50 dark:bg-red-950/20'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {keyword.status === 'valid' ? (
                          <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                        ) : keyword.status === 'duplicate' ? (
                          <AlertCircle className="h-4 w-4 shrink-0 text-yellow-500" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                        )}
                        <span className="truncate">{keyword.keyword_text || '(empty)'}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {keyword.content_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {keyword.month_year || '?'}
                        </Badge>
                        {keyword.error && (
                          <span className="text-destructive text-xs">{keyword.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {step === 'preview' && (
            <Button onClick={handleImport} disabled={!companyId || validCount === 0 || importing}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {validCount} Keywords
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
