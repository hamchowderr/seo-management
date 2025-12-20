-- SEO Monster - Article Comments
-- ============================================
-- This migration adds internal comments for articles
-- Comments are for internal team use only - clients cannot see them

-- ============================================
-- ARTICLE COMMENTS TABLE
-- ============================================

CREATE TABLE article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_article_comments_article ON article_comments(article_id);
CREATE INDEX idx_article_comments_user ON article_comments(user_id);
CREATE INDEX idx_article_comments_created ON article_comments(created_at DESC);

-- Auto-update timestamp trigger
CREATE TRIGGER update_article_comments_updated_at
  BEFORE UPDATE ON article_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- Admin and Project Manager have full access to all comments
CREATE POLICY "Admin/PM full access to comments"
  ON article_comments FOR ALL
  USING (is_admin_or_pm(auth.uid()));

-- Writers can view comments on articles they are assigned to
CREATE POLICY "Writers can view comments on assigned articles"
  ON article_comments FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'writer'
    AND EXISTS (
      SELECT 1 FROM article_assignments aa
      WHERE aa.article_id = article_comments.article_id
      AND aa.user_id = auth.uid()
      AND aa.is_active = true
    )
  );

-- Writers can create comments on articles they are assigned to
CREATE POLICY "Writers can insert comments on assigned articles"
  ON article_comments FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'writer'
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM article_assignments aa
      WHERE aa.article_id = article_comments.article_id
      AND aa.user_id = auth.uid()
      AND aa.is_active = true
    )
  );

-- Editors can view comments on articles in their companies
CREATE POLICY "Editors can view comments"
  ON article_comments FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'editor'
    AND EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_comments.article_id
      AND user_has_company_access(auth.uid(), a.company_id)
    )
  );

-- Editors can create comments on articles in their companies
CREATE POLICY "Editors can insert comments"
  ON article_comments FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'editor'
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_comments.article_id
      AND user_has_company_access(auth.uid(), a.company_id)
    )
  );

-- Posters can view comments on articles in their companies
CREATE POLICY "Posters can view comments"
  ON article_comments FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'poster'
    AND EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_comments.article_id
      AND user_has_company_access(auth.uid(), a.company_id)
    )
  );

-- Posters can create comments on articles in their companies
CREATE POLICY "Posters can insert comments"
  ON article_comments FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'poster'
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_comments.article_id
      AND user_has_company_access(auth.uid(), a.company_id)
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON article_comments FOR DELETE
  USING (user_id = auth.uid());

-- IMPORTANT: Clients have NO access to comments (internal only)
-- No policy is created for the 'client' role
