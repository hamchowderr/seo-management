import { z } from 'zod'
import { uuidSchema, monthYearSchema } from './common'
import { contentTypeSchema } from './keyword'

export const articleStageSchema = z.enum([
  'keyword_hopper',
  'needs_writing',
  'ready_for_editing',
  'ready_for_approval',
  'assigned_for_posting',
  'published',
])

export const createArticleSchema = z.object({
  company_id: uuidSchema,
  keyword_id: uuidSchema.optional(),
  title: z.string().min(1, 'Title is required').max(200),
  content_type: contentTypeSchema.default('seo'),
  month_year: monthYearSchema,
})

export const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(500000).optional().nullable(),
  google_doc_url: z.string().url().optional().nullable(),
  published_url: z.string().url().optional().nullable(),
})

export const moveArticleSchema = z.object({
  to_stage: articleStageSchema,
  notes: z.string().max(500).optional(),
})

export const assignArticleSchema = z.object({
  user_id: uuidSchema,
  role: z.enum(['writer', 'editor', 'poster']),
})

export const unassignArticleSchema = z.object({
  assignment_id: uuidSchema,
})

export const completeChecklistItemSchema = z.object({
  checklist_item_id: uuidSchema,
  notes: z.string().max(500).optional(),
})

export const publishArticleSchema = z.object({
  published_url: z.string().url('Valid URL is required'),
})

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
})

export type ArticleStage = z.infer<typeof articleStageSchema>
export type CreateArticleInput = z.infer<typeof createArticleSchema>
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>
export type MoveArticleInput = z.infer<typeof moveArticleSchema>
export type AssignArticleInput = z.infer<typeof assignArticleSchema>
export type CompleteChecklistItemInput = z.infer<typeof completeChecklistItemSchema>
export type PublishArticleInput = z.infer<typeof publishArticleSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
