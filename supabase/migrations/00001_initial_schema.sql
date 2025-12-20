-- SEO Monster - Initial Schema
-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'project_manager',
  'writer',
  'editor',
  'poster',
  'client'
);

CREATE TYPE article_stage AS ENUM (
  'keyword_hopper',
  'needs_writing',
  'ready_for_editing',
  'ready_for_approval',
  'assigned_for_posting',
  'published'
);

CREATE TYPE content_type AS ENUM (
  'blog',
  'seo'
);

CREATE TYPE notification_preference AS ENUM (
  'email',
  'slack',
  'both'
);

-- ============================================
-- TABLES
-- ============================================

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  website_url TEXT,

  -- Quotas (default: 6 SEO, 2 Blog per month)
  blog_quota INTEGER DEFAULT 2,
  seo_quota INTEGER DEFAULT 6,

  -- Integration settings
  google_drive_folder_id TEXT,
  slack_channel_id TEXT,
  slack_webhook_url TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'writer',

  -- Notification preferences
  notification_preference notification_preference DEFAULT 'email',
  slack_user_id TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Company assignments (many-to-many)
CREATE TABLE user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, company_id)
);

-- Keywords table (Keyword Hopper)
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keyword_text TEXT NOT NULL,
  content_type content_type NOT NULL DEFAULT 'seo',
  month_year TEXT NOT NULL, -- e.g., "DEC25"

  -- Status
  is_used BOOLEAN DEFAULT false,

  -- Submitted by
  submitted_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table (main content)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id),

  -- Article info
  title TEXT,
  content_type content_type NOT NULL DEFAULT 'seo',
  stage article_stage NOT NULL DEFAULT 'needs_writing',

  -- Naming convention fields
  article_number INTEGER NOT NULL,
  month_year TEXT NOT NULL, -- e.g., "DEC25"

  -- Generated full title (computed on insert/update)
  full_title TEXT,

  -- Google Docs integration
  google_doc_id TEXT,
  google_doc_url TEXT,

  -- Published info
  published_url TEXT,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Article assignments
CREATE TABLE article_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_role user_role NOT NULL, -- writer, editor, poster

  -- Status
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- Calculated time held

  UNIQUE(article_id, assigned_role, is_active)
);

-- Checklist items (configurable)
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article checklist completions
CREATE TABLE article_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  UNIQUE(article_id, checklist_item_id)
);

-- Article history/audit log
CREATE TABLE article_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Change info
  action TEXT NOT NULL, -- 'stage_change', 'assignment', 'edit', etc.
  from_stage article_stage,
  to_stage article_stage,
  details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- URL tracking (for published articles)
CREATE TABLE url_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  published_url TEXT NOT NULL,

  -- Verification status
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration tokens storage
CREATE TABLE integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  provider TEXT NOT NULL, -- 'google', 'slack'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider),
  UNIQUE(company_id, provider)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_keywords_company ON keywords(company_id);
CREATE INDEX idx_keywords_used ON keywords(is_used);
CREATE INDEX idx_keywords_month_year ON keywords(month_year);
CREATE INDEX idx_articles_company ON articles(company_id);
CREATE INDEX idx_articles_stage ON articles(stage);
CREATE INDEX idx_articles_company_stage ON articles(company_id, stage);
CREATE INDEX idx_articles_month_year ON articles(month_year);
CREATE INDEX idx_article_assignments_article ON article_assignments(article_id);
CREATE INDEX idx_article_assignments_user ON article_assignments(user_id);
CREATE INDEX idx_article_assignments_active ON article_assignments(is_active);
CREATE INDEX idx_article_history_article ON article_history(article_id);
CREATE INDEX idx_user_companies_user ON user_companies(user_id);
CREATE INDEX idx_user_companies_company ON user_companies(company_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get next article number for a company/month/type
CREATE OR REPLACE FUNCTION get_next_article_number(
  p_company_id UUID,
  p_month_year TEXT,
  p_content_type content_type
) RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(article_number), 0) + 1
  INTO next_num
  FROM articles
  WHERE company_id = p_company_id
    AND month_year = p_month_year
    AND content_type = p_content_type;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate article card name
-- Format: {COMPANY} {TYPE} {#} - {Title} - {MONYY}
-- Posted: POSTED-{MONYY} - {COMPANY} {TYPE} {#} - {Title}
CREATE OR REPLACE FUNCTION generate_article_name(
  p_company_name TEXT,
  p_content_type content_type,
  p_article_number INTEGER,
  p_title TEXT,
  p_month_year TEXT,
  p_is_posted BOOLEAN DEFAULT false
) RETURNS TEXT AS $$
DECLARE
  type_abbrev TEXT;
  result TEXT;
BEGIN
  type_abbrev := UPPER(p_content_type::TEXT);

  IF p_is_posted THEN
    result := 'POSTED-' || p_month_year || ' - ' ||
              UPPER(p_company_name) || ' ' || type_abbrev || ' ' ||
              p_article_number || ' - ' || COALESCE(p_title, 'Untitled');
  ELSE
    result := UPPER(p_company_name) || ' ' || type_abbrev || ' ' ||
              p_article_number || ' - ' || COALESCE(p_title, 'Untitled') ||
              ' - ' || p_month_year;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to format current month/year
CREATE OR REPLACE FUNCTION get_current_month_year() RETURNS TEXT AS $$
DECLARE
  months TEXT[] := ARRAY['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                          'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YY');
  RETURN months[EXTRACT(MONTH FROM NOW())::INTEGER] || year_str;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate full_title for articles
CREATE OR REPLACE FUNCTION update_article_full_title()
RETURNS TRIGGER AS $$
DECLARE
  company_name TEXT;
BEGIN
  SELECT name INTO company_name FROM companies WHERE id = NEW.company_id;

  NEW.full_title := generate_article_name(
    company_name,
    NEW.content_type,
    NEW.article_number,
    NEW.title,
    NEW.month_year,
    NEW.stage = 'published'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_keywords_updated_at
  BEFORE UPDATE ON keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_url_tracking_updated_at
  BEFORE UPDATE ON url_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_integration_tokens_updated_at
  BEFORE UPDATE ON integration_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate full_title on insert/update
CREATE TRIGGER articles_generate_full_title
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_article_full_title();

-- ============================================
-- SEED DATA - Default Checklist Items
-- ============================================

INSERT INTO checklist_items (name, description, sort_order) VALUES
  ('SEO check', 'Make sure Title, Description pass SEO check', 1),
  ('Image optimization', 'Change the name of images on page to include Keyword', 2),
  ('Update card', 'When finished, add link to card and update title to POSTED format', 3),
  ('URL tracking', 'Add link to appropriate tab on the URL tracking sheet', 4);
