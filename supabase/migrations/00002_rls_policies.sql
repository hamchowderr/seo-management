-- SEO Monster - Row Level Security Policies
-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user role from users table
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has access to a company
CREATE OR REPLACE FUNCTION user_has_company_access(p_user_id UUID, p_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins and Project Managers have access to all companies
  IF (SELECT role FROM users WHERE id = p_user_id) IN ('admin', 'project_manager') THEN
    RETURN true;
  END IF;

  -- Check user_companies assignment
  RETURN EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_id = p_user_id AND company_id = p_company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin or project manager
CREATE OR REPLACE FUNCTION is_admin_or_pm(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT (SELECT role FROM users WHERE id = p_user_id) IN ('admin', 'project_manager');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- COMPANIES POLICIES
-- ============================================

-- Admins can do everything with companies
CREATE POLICY "Admin full access to companies"
  ON companies FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Project managers can view and update (not create/delete) companies
CREATE POLICY "PM can view companies"
  ON companies FOR SELECT
  USING (get_user_role(auth.uid()) = 'project_manager');

CREATE POLICY "PM can update companies"
  ON companies FOR UPDATE
  USING (get_user_role(auth.uid()) = 'project_manager');

-- Other users can view assigned companies
CREATE POLICY "Users can view assigned companies"
  ON companies FOR SELECT
  USING (user_has_company_access(auth.uid(), id));

-- ============================================
-- USERS POLICIES
-- ============================================

-- Admin full access to users
CREATE POLICY "Admin full access to users"
  ON users FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Users can view themselves
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update themselves (limited fields via application logic)
CREATE POLICY "Users can update themselves"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Users can view colleagues in same company
CREATE POLICY "Users can view colleagues"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc1
      JOIN user_companies uc2 ON uc1.company_id = uc2.company_id
      WHERE uc1.user_id = auth.uid() AND uc2.user_id = users.id
    )
  );

-- Project managers can view all users
CREATE POLICY "PM can view all users"
  ON users FOR SELECT
  USING (get_user_role(auth.uid()) = 'project_manager');

-- ============================================
-- USER_COMPANIES POLICIES
-- ============================================

-- Admin full access
CREATE POLICY "Admin full access to user_companies"
  ON user_companies FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- PM can view all
CREATE POLICY "PM can view user_companies"
  ON user_companies FOR SELECT
  USING (get_user_role(auth.uid()) = 'project_manager');

-- Users can view their own assignments
CREATE POLICY "Users can view own company assignments"
  ON user_companies FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- KEYWORDS POLICIES
-- ============================================

-- Admin/PM full access to keywords
CREATE POLICY "Admin/PM full access to keywords"
  ON keywords FOR ALL
  USING (is_admin_or_pm(auth.uid()));

-- Users can view keywords for assigned companies
CREATE POLICY "Users can view keywords for assigned companies"
  ON keywords FOR SELECT
  USING (user_has_company_access(auth.uid(), company_id));

-- Clients can submit keywords to their company
CREATE POLICY "Clients can insert keywords"
  ON keywords FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'client'
    AND user_has_company_access(auth.uid(), company_id)
  );

-- ============================================
-- ARTICLES POLICIES
-- ============================================

-- Admin/PM full access to articles
CREATE POLICY "Admin/PM full access to articles"
  ON articles FOR ALL
  USING (is_admin_or_pm(auth.uid()));

-- Writers see assigned articles
CREATE POLICY "Writers see assigned articles"
  ON articles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'writer'
    AND EXISTS (
      SELECT 1 FROM article_assignments
      WHERE article_id = articles.id
      AND user_id = auth.uid()
      AND is_active = true
    )
  );

-- Writers can update assigned articles in writing stage
CREATE POLICY "Writers can update assigned articles"
  ON articles FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'writer'
    AND stage IN ('needs_writing', 'ready_for_editing')
    AND EXISTS (
      SELECT 1 FROM article_assignments
      WHERE article_id = articles.id
      AND user_id = auth.uid()
      AND assigned_role = 'writer'
      AND is_active = true
    )
  );

-- Editors see articles in editing/approval stages for assigned companies
CREATE POLICY "Editors see articles for editing"
  ON articles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'editor'
    AND stage IN ('ready_for_editing', 'ready_for_approval')
    AND user_has_company_access(auth.uid(), company_id)
  );

-- Editors can update articles in editing stages
CREATE POLICY "Editors can update articles"
  ON articles FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'editor'
    AND stage IN ('ready_for_editing', 'ready_for_approval')
    AND user_has_company_access(auth.uid(), company_id)
  );

-- Posters see all articles for their companies
CREATE POLICY "Posters see all articles"
  ON articles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'poster'
    AND user_has_company_access(auth.uid(), company_id)
  );

-- Posters can update articles assigned for posting
CREATE POLICY "Posters can update articles for posting"
  ON articles FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'poster'
    AND stage = 'assigned_for_posting'
    AND user_has_company_access(auth.uid(), company_id)
  );

-- Clients can view own company articles (read-only)
CREATE POLICY "Clients can view company articles"
  ON articles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client'
    AND user_has_company_access(auth.uid(), company_id)
  );

-- ============================================
-- ARTICLE_ASSIGNMENTS POLICIES
-- ============================================

-- Admin/PM full access to assignments
CREATE POLICY "Admin/PM full access to assignments"
  ON article_assignments FOR ALL
  USING (is_admin_or_pm(auth.uid()));

-- Users can view own assignments
CREATE POLICY "Users can view own assignments"
  ON article_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Users can view assignments for articles they can access
CREATE POLICY "Users can view article assignments"
  ON article_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_assignments.article_id
      AND user_has_company_access(auth.uid(), a.company_id)
    )
  );

-- ============================================
-- ARTICLE_CHECKLIST POLICIES
-- ============================================

-- Admin/PM/Poster can manage checklist
CREATE POLICY "Admin/PM/Poster can manage checklist"
  ON article_checklist FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('admin', 'project_manager', 'poster')
    AND EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_checklist.article_id
      AND user_has_company_access(auth.uid(), a.company_id)
    )
  );

-- Users can view checklist for accessible articles
CREATE POLICY "Users can view article checklist"
  ON article_checklist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_checklist.article_id
      AND user_has_company_access(auth.uid(), a.company_id)
    )
  );

-- ============================================
-- ARTICLE_HISTORY POLICIES
-- ============================================

-- Admin/PM can view all history
CREATE POLICY "Admin/PM can view all history"
  ON article_history FOR SELECT
  USING (is_admin_or_pm(auth.uid()));

-- Users can view history for accessible articles
CREATE POLICY "Users can view accessible article history"
  ON article_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_history.article_id
      AND user_has_company_access(auth.uid(), a.company_id)
    )
  );

-- Any authenticated user can insert history (for their actions)
CREATE POLICY "Users can insert history"
  ON article_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- URL_TRACKING POLICIES
-- ============================================

-- Users can view url tracking for accessible articles
CREATE POLICY "Users can view url tracking"
  ON url_tracking FOR SELECT
  USING (user_has_company_access(auth.uid(), company_id));

-- Admin/PM/Poster can manage url tracking
CREATE POLICY "Admin/PM/Poster can manage url tracking"
  ON url_tracking FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('admin', 'project_manager', 'poster')
    AND user_has_company_access(auth.uid(), company_id)
  );

-- ============================================
-- CHECKLIST_ITEMS POLICIES
-- ============================================

-- Everyone can view checklist items
CREATE POLICY "Everyone can view checklist items"
  ON checklist_items FOR SELECT
  USING (true);

-- Only admin can manage checklist items
CREATE POLICY "Admin can manage checklist items"
  ON checklist_items FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- INTEGRATION_TOKENS POLICIES
-- ============================================

-- Users can manage own tokens
CREATE POLICY "Users can manage own tokens"
  ON integration_tokens FOR ALL
  USING (user_id = auth.uid());

-- Admin can view company tokens
CREATE POLICY "Admin can view company tokens"
  ON integration_tokens FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'admin'
    OR (company_id IS NOT NULL AND user_has_company_access(auth.uid(), company_id))
  );
