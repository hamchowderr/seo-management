import { createClient } from '@/lib/server'
import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { getPrompt, type ContentType, type PromptType } from '@/lib/ai/prompts'
import { z } from 'zod'

const generateSchema = z.object({
  contentType: z.enum(['seo', 'blog']),
  promptType: z.enum(['title', 'outline', 'article', 'meta']),
  keyword: z.string().min(1),
  companyName: z.string().min(1),
  additionalContext: z.string().optional(),
})

export async function POST(request: NextRequest) {
  console.log('[AI Generate] Request received')
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.log('[AI Generate] Unauthorized - no user')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    console.log('[AI Generate] User authenticated:', user.id)

    // Check user role (must be writer or above)
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

    const allowedRoles = ['admin', 'project_manager', 'writer']
    if (!allowedRoles.includes(profile?.role || '')) {
      console.log('[AI Generate] Insufficient permissions, role:', profile?.role)
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    console.log('[AI Generate] Role check passed:', profile?.role)

    const body = await request.json()
    const validatedData = generateSchema.parse(body)
    console.log('[AI Generate] Validated data:', validatedData)

    const prompt = getPrompt(
      validatedData.contentType as ContentType,
      validatedData.promptType as PromptType,
      {
        keyword: validatedData.keyword,
        companyName: validatedData.companyName,
        additionalContext: validatedData.additionalContext,
      }
    )
    console.log('[AI Generate] Prompt generated, length:', prompt.length)

    console.log('[AI Generate] Calling gateway with model: anthropic/claude-sonnet-4')
    const result = streamText({
      model: 'anthropic/claude-sonnet-4',
      prompt,
    })

    console.log('[AI Generate] Returning stream response')
    return result.toTextStreamResponse()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Validation error', details: error.issues }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.error('AI generation error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
