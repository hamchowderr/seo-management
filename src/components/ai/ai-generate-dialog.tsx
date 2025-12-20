'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface AIGenerateDialogProps {
  keyword: string
  companyName: string
  contentType: 'seo' | 'blog'
  onInsert?: (content: string) => void
  children?: React.ReactNode
}

const PROMPT_TYPES = {
  title: { label: 'Title', description: 'Generate an optimized title' },
  outline: { label: 'Outline', description: 'Create an article outline' },
  article: { label: 'Full Article', description: 'Generate complete article' },
  meta: { label: 'Meta Content', description: 'Generate meta title and description' },
} as const

type PromptType = keyof typeof PROMPT_TYPES

export function AIGenerateDialog({
  keyword,
  companyName,
  contentType,
  onInsert,
  children,
}: AIGenerateDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [promptType, setPromptType] = useState<PromptType>('title')
  const [additionalContext, setAdditionalContext] = useState('')
  const [copied, setCopied] = useState(false)

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: '/api/ai/generate',
    body: {
      contentType,
      promptType,
      keyword,
      companyName,
      additionalContext,
    },
    onError: (err) => {
      console.error('[AI Generate Client] Error:', err)
      toast({
        title: 'Generation Failed',
        description: err.message || 'Failed to generate content',
        variant: 'destructive',
      })
    },
    onFinish: (prompt, completion) => {
      console.log('[AI Generate Client] Finished, completion length:', completion.length)
    },
  })

  const handleGenerate = async () => {
    setCompletion('')
    await complete('')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(completion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard',
    })
  }

  const handleInsert = () => {
    onInsert?.(completion)
    setOpen(false)
    toast({
      title: 'Inserted',
      description: 'Content has been inserted',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Generate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            AI Content Generation
          </DialogTitle>
          <DialogDescription>
            Generate content using AI based on your keyword and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Keyword</Label>
              <p className="bg-muted rounded p-2 text-sm font-medium">{keyword}</p>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <p className="bg-muted rounded p-2 text-sm font-medium">{companyName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content Type</Label>
            <Badge variant="outline" className="capitalize">
              {contentType}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>What to Generate</Label>
            <Tabs value={promptType} onValueChange={(v) => setPromptType(v as PromptType)}>
              <TabsList className="grid w-full grid-cols-4">
                {Object.entries(PROMPT_TYPES).map(([key, config]) => (
                  <TabsTrigger key={key} value={key}>
                    {config.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(PROMPT_TYPES).map(([key, config]) => (
                <TabsContent key={key} value={key} className="mt-2">
                  <p className="text-muted-foreground text-sm">{config.description}</p>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Add any specific requirements, tone preferences, or additional context..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {PROMPT_TYPES[promptType].label}
              </>
            )}
          </Button>

          {(completion || isLoading) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Content</Label>
                {completion && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="mr-1 h-4 w-4" />
                      ) : (
                        <Copy className="mr-1 h-4 w-4" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    {onInsert && (
                      <Button size="sm" onClick={handleInsert}>
                        Insert
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <ScrollArea className="h-[300px] w-full rounded border p-4">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {completion || (
                    <span className="text-muted-foreground animate-pulse">
                      Generating content...
                    </span>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
