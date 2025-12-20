import { z } from 'zod'
import { uuidSchema, monthYearSchema } from './common'

export const contentTypeSchema = z.enum(['blog', 'seo'])

export const createKeywordSchema = z.object({
  company_id: uuidSchema,
  keyword_text: z.string().min(1, 'Keyword is required').max(500),
  content_type: contentTypeSchema.default('seo'),
  month_year: monthYearSchema,
  notes: z.string().max(1000).optional().nullable(),
})

export const updateKeywordSchema = z.object({
  keyword_text: z.string().min(1).max(500).optional(),
  content_type: contentTypeSchema.optional(),
  month_year: monthYearSchema.optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export const bulkCreateKeywordsSchema = z.object({
  company_id: uuidSchema,
  content_type: contentTypeSchema.default('seo'),
  month_year: monthYearSchema,
  keywords: z.array(z.string().min(1).max(500)).min(1, 'At least one keyword is required'),
})

export const convertKeywordSchema = z.object({
  keyword_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200).optional(),
  assigned_writer_id: uuidSchema.optional(),
})

// Schema for CSV import - each keyword has its own content_type and month_year
export const importKeywordsSchema = z.object({
  company_id: uuidSchema,
  keywords: z
    .array(
      z.object({
        keyword_text: z.string().min(1, 'Keyword is required').max(500),
        content_type: contentTypeSchema,
        month_year: monthYearSchema,
      })
    )
    .min(1, 'At least one keyword is required')
    .max(500, 'Maximum 500 keywords per import'),
})

export type ContentType = z.infer<typeof contentTypeSchema>
export type CreateKeywordInput = z.infer<typeof createKeywordSchema>
export type UpdateKeywordInput = z.infer<typeof updateKeywordSchema>
export type BulkCreateKeywordsInput = z.infer<typeof bulkCreateKeywordsSchema>
export type ConvertKeywordInput = z.infer<typeof convertKeywordSchema>
export type ImportKeywordsInput = z.infer<typeof importKeywordsSchema>
