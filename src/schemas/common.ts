import { z } from 'zod'

// UUID validation (permissive - just checks 8-4-4-4-12 hex format)
export const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID format')

// Pagination - handles null/undefined from searchParams.get()
export const paginationSchema = z.object({
  page: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.coerce.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.coerce.number().int().positive().max(100).default(20)
  ),
})

// Month/Year format (e.g., "DEC25")
export const monthYearSchema = z
  .string()
  .regex(
    /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}$/,
    'Must be in format MONYY (e.g., DEC25)'
  )

// Common response types
export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
})

export type PaginationParams = z.infer<typeof paginationSchema>
export type ApiError = z.infer<typeof apiErrorSchema>
