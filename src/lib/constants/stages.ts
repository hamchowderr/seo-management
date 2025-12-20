import type { Database } from '@/types/database'
import type { UserRole } from './roles'

export type ArticleStage = Database['public']['Enums']['article_stage']

export const ARTICLE_STAGES = {
  keyword_hopper: 'keyword_hopper',
  needs_writing: 'needs_writing',
  ready_for_editing: 'ready_for_editing',
  ready_for_approval: 'ready_for_approval',
  assigned_for_posting: 'assigned_for_posting',
  published: 'published',
} as const

export const STAGE_LABELS: Record<ArticleStage, string> = {
  keyword_hopper: 'Keyword Hopper',
  needs_writing: 'Needs Writing',
  ready_for_editing: 'Ready for Editing',
  ready_for_approval: 'Ready for Approval',
  assigned_for_posting: 'Assigned for Posting',
  published: 'Published',
}

export const STAGE_COLORS: Record<ArticleStage, string> = {
  keyword_hopper: '#6b7280',
  needs_writing: '#3b82f6',
  ready_for_editing: '#f59e0b',
  ready_for_approval: '#8b5cf6',
  assigned_for_posting: '#f97316',
  published: '#22c55e',
}

// Tailwind class colors for compatibility
export const STAGE_BG_CLASSES: Record<ArticleStage, string> = {
  keyword_hopper: 'bg-gray-100 text-gray-800',
  needs_writing: 'bg-blue-100 text-blue-800',
  ready_for_editing: 'bg-yellow-100 text-yellow-800',
  ready_for_approval: 'bg-purple-100 text-purple-800',
  assigned_for_posting: 'bg-orange-100 text-orange-800',
  published: 'bg-green-100 text-green-800',
}

// Stage order for display and workflow
export const STAGE_ORDER: ArticleStage[] = [
  'keyword_hopper',
  'needs_writing',
  'ready_for_editing',
  'ready_for_approval',
  'assigned_for_posting',
  'published',
]

// Workflow stages (excluding keyword hopper which is just a pool)
export const WORKFLOW_STAGES: ArticleStage[] = [
  'needs_writing',
  'ready_for_editing',
  'ready_for_approval',
  'assigned_for_posting',
  'published',
]

// Stage transition rules
export const STAGE_TRANSITIONS: Record<
  ArticleStage,
  {
    next: ArticleStage[]
    previous: ArticleStage[]
    allowedRoles: UserRole[]
    notifyRoles: UserRole[]
  }
> = {
  keyword_hopper: {
    next: ['needs_writing'],
    previous: [],
    allowedRoles: ['admin', 'project_manager'],
    notifyRoles: [],
  },
  needs_writing: {
    next: ['ready_for_editing'],
    previous: ['keyword_hopper'],
    allowedRoles: ['admin', 'project_manager', 'writer'],
    notifyRoles: ['admin', 'project_manager', 'writer'],
  },
  ready_for_editing: {
    next: ['ready_for_approval', 'needs_writing'],
    previous: ['needs_writing'],
    allowedRoles: ['admin', 'project_manager', 'editor'],
    notifyRoles: ['editor'],
  },
  ready_for_approval: {
    next: ['assigned_for_posting', 'ready_for_editing'],
    previous: ['ready_for_editing'],
    allowedRoles: ['admin', 'project_manager'],
    notifyRoles: ['admin', 'project_manager', 'editor'],
  },
  assigned_for_posting: {
    next: ['published', 'ready_for_approval'],
    previous: ['ready_for_approval'],
    allowedRoles: ['admin', 'project_manager', 'poster'],
    notifyRoles: ['poster', 'admin'],
  },
  published: {
    next: [],
    previous: ['assigned_for_posting'],
    allowedRoles: ['admin'],
    notifyRoles: ['admin'],
  },
}

export function canTransitionTo(
  currentStage: ArticleStage,
  targetStage: ArticleStage,
  userRole: UserRole
): boolean {
  const transitions = STAGE_TRANSITIONS[currentStage]
  const canMove =
    transitions.next.includes(targetStage) || transitions.previous.includes(targetStage)
  const hasPermission = transitions.allowedRoles.includes(userRole)
  return canMove && hasPermission
}

export function getNextStages(currentStage: ArticleStage): ArticleStage[] {
  return STAGE_TRANSITIONS[currentStage].next
}

export function getPreviousStages(currentStage: ArticleStage): ArticleStage[] {
  return STAGE_TRANSITIONS[currentStage].previous
}

export function getAllowedTransitions(currentStage: ArticleStage): ArticleStage[] {
  const transitions = STAGE_TRANSITIONS[currentStage]
  return [...new Set([...transitions.next, ...transitions.previous])]
}
