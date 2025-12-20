import type { ArticleStage } from '@/schemas'

export interface ArticleAssignment {
  id: string
  user_id: string
  assigned_role: string
  is_active: boolean
  users: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

export interface BoardArticle {
  id: string
  title: string
  full_title: string
  company_id: string
  keyword_id: string | null
  content_type: 'seo' | 'blog'
  article_number: number
  month_year: string
  stage: ArticleStage
  word_count: number | null
  google_doc_url: string | null
  published_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  companies: {
    id: string
    name: string
    slug: string
  }
  keywords?: {
    id: string
    keyword_text: string
  }
  article_assignments: ArticleAssignment[]
}

export interface BoardColumn {
  id: ArticleStage
  title: string
  articles: BoardArticle[]
  color: string
}

export interface BoardState {
  columns: Record<ArticleStage, BoardArticle[]>
}

export interface DragItem {
  id: string
  article: BoardArticle
  columnId: ArticleStage
}
