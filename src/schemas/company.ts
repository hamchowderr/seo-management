import { z } from 'zod'
import { uuidSchema } from './common'

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
  website_url: z.string().url().optional().nullable(),
  blog_quota: z.number().int().positive().default(2),
  seo_quota: z.number().int().positive().default(6),
  google_drive_folder_id: z.string().optional().nullable(),
  slack_channel_id: z.string().optional().nullable(),
  slack_webhook_url: z.string().url().optional().nullable(),
})

export const updateCompanySchema = createCompanySchema.partial()

export const companyIdSchema = z.object({
  id: uuidSchema,
})

export const updateQuotasSchema = z.object({
  blog_quota: z.number().int().positive().optional(),
  seo_quota: z.number().int().positive().optional(),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type UpdateQuotasInput = z.infer<typeof updateQuotasSchema>
