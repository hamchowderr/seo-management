export interface ArticleFilters {
  companyId?: string
  stage?: string
  contentType?: string
  monthYear?: string
  assignedTo?: string
  page?: number
  limit?: number
}

export interface BoardFilters {
  companyId?: string
  monthYear?: string
  contentType?: string
}

export interface KeywordFilters {
  companyId?: string
  contentType?: string
  monthYear?: string
}

export interface UserFilters {
  role?: string
}

export interface StatsFilters {
  companyId?: string
  monthYear?: string
}

export const queryKeys = {
  // Companies
  companies: ['companies'] as const,
  company: (id: string) => ['companies', id] as const,

  // Articles
  articles: ['articles'] as const,
  articlesList: (filters: ArticleFilters) => ['articles', 'list', filters] as const,
  article: (id: string) => ['articles', id] as const,
  articleChecklist: (id: string) => ['articles', id, 'checklist'] as const,
  articleComments: (id: string) => ['articles', id, 'comments'] as const,
  articleHistory: (id: string) => ['articles', id, 'history'] as const,
  articleRevisions: (id: string) => ['articles', id, 'revisions'] as const,

  // Board
  board: ['board'] as const,
  boardArticles: (filters: BoardFilters) => ['board', 'articles', filters] as const,

  // Keywords
  keywords: ['keywords'] as const,
  keywordsList: (filters: KeywordFilters) => ['keywords', 'list', filters] as const,
  keyword: (id: string) => ['keywords', id] as const,

  // Users
  users: ['users'] as const,
  usersList: (filters?: UserFilters) => ['users', 'list', filters] as const,
  user: (id: string) => ['users', id] as const,

  // Integrations
  integrations: ['integrations'] as const,

  // Stats/Reports
  stats: (filters?: StatsFilters) => ['stats', filters] as const,
  reports: (filters?: StatsFilters) => ['reports', filters] as const,

  // Command menu search
  search: ['search'] as const,
}
