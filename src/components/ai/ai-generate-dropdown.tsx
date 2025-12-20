'use client'

import { useState } from 'react'
import { Bot, Loader2, FileText, List, BookOpen, Tags } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { InsertMode } from '@/components/articles/article-editor'

interface AIGenerateDropdownProps {
  keyword: string
  companyName: string
  contentType: 'seo' | 'blog'
  onInsert: (content: string, mode: InsertMode) => void
  onStream?: (content: string) => void
}

const PROMPT_OPTIONS = [
  {
    type: 'title',
    label: 'Generate Title',
    icon: FileText,
    description: 'SEO-optimized title',
    mode: 'title' as InsertMode,
  },
  {
    type: 'outline',
    label: 'Generate Outline',
    icon: List,
    description: 'Article structure',
    mode: 'replace' as InsertMode,
  },
  {
    type: 'article',
    label: 'Generate Full Article',
    icon: BookOpen,
    description: 'Complete article',
    mode: 'replace' as InsertMode,
  },
  {
    type: 'meta',
    label: 'Generate Meta',
    icon: Tags,
    description: 'Meta title & description',
    mode: 'append' as InsertMode,
  },
] as const

type PromptType = (typeof PROMPT_OPTIONS)[number]['type']

export function AIGenerateDropdown({
  keyword,
  companyName,
  contentType,
  onInsert,
  onStream,
}: AIGenerateDropdownProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState<PromptType | null>(null)

  const handleGenerate = async (promptType: PromptType, mode: InsertMode) => {
    setIsGenerating(true)
    setGeneratingType(promptType)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          promptType,
          keyword,
          companyName,
          additionalContext: '',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate content')
      }

      // Read the stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })

        // Stream content to editor in real-time
        if (onStream && content) {
          onStream(content)
        }
      }

      if (content) {
        // Final insert with proper mode (handles title replacement, etc.)
        onInsert(content, mode)
        toast.success('Content generated')
      } else {
        toast.error('No content was generated')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
      setGeneratingType(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Bot className="h-3 w-3" />
          )}
          AI
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Generate
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROMPT_OPTIONS.map((option) => {
          const Icon = option.icon
          const isThisGenerating = isGenerating && generatingType === option.type
          return (
            <DropdownMenuItem
              key={option.type}
              onClick={() => handleGenerate(option.type, option.mode)}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isThisGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <div className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-muted-foreground text-xs">{option.description}</span>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
