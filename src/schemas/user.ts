import { z } from 'zod'
import { uuidSchema } from './common'

export const userRoleSchema = z.enum([
  'admin',
  'project_manager',
  'writer',
  'editor',
  'poster',
  'client',
])

export const notificationPreferenceSchema = z.enum(['email', 'slack', 'both'])

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  role: userRoleSchema.default('writer'),
  notification_preference: notificationPreferenceSchema.default('email'),
  company_ids: z.array(uuidSchema).optional(), // Companies to assign user to
})

export const updateUserSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  role: userRoleSchema.optional(),
  notification_preference: notificationPreferenceSchema.optional(),
  slack_user_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  role: userRoleSchema.default('writer'),
  company_ids: z.array(uuidSchema).min(1, 'At least one company is required'),
})

export const assignUserToCompanySchema = z.object({
  user_id: uuidSchema,
  company_id: uuidSchema,
})

export type UserRole = z.infer<typeof userRoleSchema>
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>
