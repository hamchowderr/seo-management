import type { Database } from '@/types/database'

export type ContentType = Database['public']['Enums']['content_type']

export const CONTENT_TYPES: Record<ContentType, { label: string; color: string }> = {
  blog: { label: 'Blog', color: '#9333ea' },
  seo: { label: 'SEO', color: '#3b82f6' },
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  blog: 'Blog',
  seo: 'SEO',
}

export const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  blog: 'bg-purple-100 text-purple-800',
  seo: 'bg-blue-100 text-blue-800',
}

// Default monthly quotas
export const DEFAULT_QUOTAS: Record<ContentType, number> = {
  blog: 2,
  seo: 6,
}
