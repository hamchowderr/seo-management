'use client'

import { useState } from 'react'
import { Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KanbanBoard } from '@/components/board/kanban-board'
import { CONTENT_TYPES } from '@/lib/constants/content-types'
import { useCompanies } from '@/hooks/queries'

export default function BoardPage() {
  const { data: companies = [] } = useCompanies()
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedContentType, setSelectedContentType] = useState<string>('')

  // Generate month options (current month and past 6 months)
  const getMonthOptions = () => {
    const options: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      const year = date.getFullYear().toString().slice(-2)
      options.push(`${month}${year}`)
    }
    return options
  }

  const clearFilters = () => {
    setSelectedCompany('')
    setSelectedMonth('')
    setSelectedContentType('')
  }

  const hasFilters = selectedCompany || selectedMonth || selectedContentType

  const openCommandMenu = () => {
    // Dispatch keyboard event to open command menu
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Board</h1>
          <p className="text-muted-foreground text-sm">Drag and drop articles between stages</p>
        </div>
        <button
          onClick={openCommandMenu}
          className="text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors md:w-64"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search articles...</span>
          <kbd className="bg-muted pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 select-none sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex shrink-0 items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
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

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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

          <Select value={selectedContentType} onValueChange={setSelectedContentType}>
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

      <div className="bg-muted/30 min-h-0 flex-1 rounded-lg border">
        <KanbanBoard
          companyId={selectedCompany && selectedCompany !== 'all' ? selectedCompany : undefined}
          monthYear={selectedMonth && selectedMonth !== 'all' ? selectedMonth : undefined}
          contentType={
            selectedContentType && selectedContentType !== 'all' ? selectedContentType : undefined
          }
        />
      </div>
    </div>
  )
}
