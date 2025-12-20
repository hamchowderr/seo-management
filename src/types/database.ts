export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      article_assignments: {
        Row: {
          article_id: string
          assigned_at: string | null
          assigned_role: Database['public']['Enums']['user_role']
          completed_at: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          article_id: string
          assigned_at?: string | null
          assigned_role: Database['public']['Enums']['user_role']
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          article_id?: string
          assigned_at?: string | null
          assigned_role?: Database['public']['Enums']['user_role']
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'article_assignments_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'article_assignments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      article_checklist: {
        Row: {
          article_id: string
          checklist_item_id: string
          completed_at: string | null
          completed_by: string | null
          id: string
          notes: string | null
        }
        Insert: {
          article_id: string
          checklist_item_id: string
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          article_id?: string
          checklist_item_id?: string
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'article_checklist_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'article_checklist_checklist_item_id_fkey'
            columns: ['checklist_item_id']
            isOneToOne: false
            referencedRelation: 'checklist_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'article_checklist_completed_by_fkey'
            columns: ['completed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      article_comments: {
        Row: {
          article_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'article_comments_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'article_comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      article_history: {
        Row: {
          action: string
          article_id: string
          created_at: string | null
          details: Json | null
          from_stage: Database['public']['Enums']['article_stage'] | null
          id: string
          to_stage: Database['public']['Enums']['article_stage'] | null
          user_id: string | null
        }
        Insert: {
          action: string
          article_id: string
          created_at?: string | null
          details?: Json | null
          from_stage?: Database['public']['Enums']['article_stage'] | null
          id?: string
          to_stage?: Database['public']['Enums']['article_stage'] | null
          user_id?: string | null
        }
        Update: {
          action?: string
          article_id?: string
          created_at?: string | null
          details?: Json | null
          from_stage?: Database['public']['Enums']['article_stage'] | null
          id?: string
          to_stage?: Database['public']['Enums']['article_stage'] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'article_history_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'article_history_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      articles: {
        Row: {
          article_number: number
          company_id: string
          content: string | null
          content_type: Database['public']['Enums']['content_type']
          content_updated_at: string | null
          created_at: string | null
          created_by: string | null
          full_title: string | null
          google_doc_id: string | null
          google_doc_url: string | null
          id: string
          keyword_id: string | null
          month_year: string
          published_at: string | null
          published_url: string | null
          stage: Database['public']['Enums']['article_stage']
          title: string | null
          updated_at: string | null
        }
        Insert: {
          article_number: number
          company_id: string
          content?: string | null
          content_type?: Database['public']['Enums']['content_type']
          content_updated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          full_title?: string | null
          google_doc_id?: string | null
          google_doc_url?: string | null
          id?: string
          keyword_id?: string | null
          month_year: string
          published_at?: string | null
          published_url?: string | null
          stage?: Database['public']['Enums']['article_stage']
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          article_number?: number
          company_id?: string
          content?: string | null
          content_type?: Database['public']['Enums']['content_type']
          content_updated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          full_title?: string | null
          google_doc_id?: string | null
          google_doc_url?: string | null
          id?: string
          keyword_id?: string | null
          month_year?: string
          published_at?: string | null
          published_url?: string | null
          stage?: Database['public']['Enums']['article_stage']
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'articles_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'articles_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'articles_keyword_id_fkey'
            columns: ['keyword_id']
            isOneToOne: false
            referencedRelation: 'keywords'
            referencedColumns: ['id']
          },
        ]
      }
      checklist_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          blog_quota: number | null
          created_at: string | null
          google_drive_folder_id: string | null
          id: string
          is_active: boolean | null
          name: string
          seo_quota: number | null
          slack_channel_id: string | null
          slack_webhook_url: string | null
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          blog_quota?: number | null
          created_at?: string | null
          google_drive_folder_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          seo_quota?: number | null
          slack_channel_id?: string | null
          slack_webhook_url?: string | null
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          blog_quota?: number | null
          created_at?: string | null
          google_drive_folder_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          seo_quota?: number | null
          slack_channel_id?: string | null
          slack_webhook_url?: string | null
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      integration_tokens: {
        Row: {
          access_token: string
          company_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          company_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          company_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'integration_tokens_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'integration_tokens_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      keywords: {
        Row: {
          company_id: string
          content_type: Database['public']['Enums']['content_type']
          created_at: string | null
          id: string
          is_used: boolean | null
          keyword_text: string
          month_year: string
          notes: string | null
          submitted_by: string | null
          updated_at: string | null
          used_at: string | null
        }
        Insert: {
          company_id: string
          content_type?: Database['public']['Enums']['content_type']
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          keyword_text: string
          month_year: string
          notes?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          used_at?: string | null
        }
        Update: {
          company_id?: string
          content_type?: Database['public']['Enums']['content_type']
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          keyword_text?: string
          month_year?: string
          notes?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'keywords_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'keywords_submitted_by_fkey'
            columns: ['submitted_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      url_tracking: {
        Row: {
          added_at: string | null
          article_id: string
          company_id: string
          id: string
          is_verified: boolean | null
          published_url: string
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          added_at?: string | null
          article_id: string
          company_id: string
          id?: string
          is_verified?: boolean | null
          published_url: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          added_at?: string | null
          article_id?: string
          company_id?: string
          id?: string
          is_verified?: boolean | null
          published_url?: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'url_tracking_article_id_fkey'
            columns: ['article_id']
            isOneToOne: false
            referencedRelation: 'articles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'url_tracking_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_companies_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_companies_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          notification_preference: Database['public']['Enums']['notification_preference'] | null
          role: Database['public']['Enums']['user_role']
          slack_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          notification_preference?: Database['public']['Enums']['notification_preference'] | null
          role?: Database['public']['Enums']['user_role']
          slack_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          notification_preference?: Database['public']['Enums']['notification_preference'] | null
          role?: Database['public']['Enums']['user_role']
          slack_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_article_name: {
        Args: {
          p_article_number: number
          p_company_name: string
          p_content_type: Database['public']['Enums']['content_type']
          p_is_posted?: boolean
          p_month_year: string
          p_title: string
        }
        Returns: string
      }
      get_current_month_year: { Args: never; Returns: string }
      get_next_article_number: {
        Args: {
          p_company_id: string
          p_content_type: Database['public']['Enums']['content_type']
          p_month_year: string
        }
        Returns: number
      }
      get_user_role: {
        Args: { p_user_id: string }
        Returns: Database['public']['Enums']['user_role']
      }
      is_admin_or_pm: { Args: { p_user_id: string }; Returns: boolean }
      user_has_company_access: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      article_stage:
        | 'keyword_hopper'
        | 'needs_writing'
        | 'ready_for_editing'
        | 'ready_for_approval'
        | 'assigned_for_posting'
        | 'published'
      content_type: 'blog' | 'seo'
      notification_preference: 'email' | 'slack' | 'both'
      user_role: 'admin' | 'project_manager' | 'writer' | 'editor' | 'poster' | 'client'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      article_stage: [
        'keyword_hopper',
        'needs_writing',
        'ready_for_editing',
        'ready_for_approval',
        'assigned_for_posting',
        'published',
      ],
      content_type: ['blog', 'seo'],
      notification_preference: ['email', 'slack', 'both'],
      user_role: ['admin', 'project_manager', 'writer', 'editor', 'poster', 'client'],
    },
  },
} as const
