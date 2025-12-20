import type { Database } from '@/types/database'

export type UserRole = Database['public']['Enums']['user_role']

export const USER_ROLES = {
  admin: 'admin',
  project_manager: 'project_manager',
  writer: 'writer',
  editor: 'editor',
  poster: 'poster',
  client: 'client',
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  writer: 'Writer',
  editor: 'Editor',
  poster: 'Poster',
  client: 'Client',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500',
  project_manager: 'bg-purple-500',
  writer: 'bg-blue-500',
  editor: 'bg-green-500',
  poster: 'bg-orange-500',
  client: 'bg-gray-500',
}

// Permission definitions for each role
export const ROLE_PERMISSIONS = {
  admin: {
    canManageUsers: true,
    canManageCompanies: true,
    canManageArticles: true,
    canViewAllArticles: true,
    canAssignArticles: true,
    canSubmitKeywords: true,
    canGenerateAI: true,
    canApproveArticles: true,
  },
  project_manager: {
    canManageUsers: false,
    canManageCompanies: false,
    canManageArticles: true,
    canViewAllArticles: true,
    canAssignArticles: true,
    canSubmitKeywords: true,
    canGenerateAI: true,
    canApproveArticles: true,
  },
  writer: {
    canManageUsers: false,
    canManageCompanies: false,
    canManageArticles: false,
    canViewAllArticles: false,
    canAssignArticles: false,
    canSubmitKeywords: false,
    canGenerateAI: true,
    canApproveArticles: false,
    canMoveToEditing: true,
  },
  editor: {
    canManageUsers: false,
    canManageCompanies: false,
    canManageArticles: false,
    canViewAllArticles: false,
    canAssignArticles: false,
    canSubmitKeywords: false,
    canGenerateAI: false,
    canApproveArticles: false,
    canMoveToApproval: true,
    canReturnToWriting: true,
  },
  poster: {
    canManageUsers: false,
    canManageCompanies: false,
    canManageArticles: false,
    canViewAllArticles: true,
    canAssignArticles: false,
    canSubmitKeywords: false,
    canGenerateAI: false,
    canApproveArticles: false,
    canCompleteChecklist: true,
    canPublish: true,
  },
  client: {
    canManageUsers: false,
    canManageCompanies: false,
    canManageArticles: false,
    canViewAllArticles: true,
    canAssignArticles: false,
    canSubmitKeywords: false,
    canGenerateAI: false,
    canApproveArticles: false,
    canViewProgress: true,
    canViewPublishedLinks: true,
  },
} as const

export type RolePermissions = (typeof ROLE_PERMISSIONS)[UserRole]

export function checkPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  return (permissions as Record<string, boolean>)[permission] ?? false
}
