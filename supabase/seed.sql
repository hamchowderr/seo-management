-- SEO Monster Seed Data
-- This file populates the database with test data for development
-- Run with: docker exec -i supabase_db_hopper psql -U postgres -d postgres -f - < supabase/seed.sql

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE article_comments CASCADE;
TRUNCATE TABLE article_history CASCADE;
TRUNCATE TABLE article_checklist CASCADE;
TRUNCATE TABLE article_assignments CASCADE;
TRUNCATE TABLE url_tracking CASCADE;
TRUNCATE TABLE articles CASCADE;
TRUNCATE TABLE keywords CASCADE;
TRUNCATE TABLE user_companies CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE checklist_items CASCADE;
TRUNCATE TABLE companies CASCADE;

-- Also clear auth users we're about to create
DELETE FROM auth.users WHERE email LIKE '%@seomonster.dev' OR email LIKE '%@vestige.com' OR email LIKE '%@techflow.io' OR email = 'admin@seomonster.dev';

-- =====================================================
-- AUTH USERS (required first due to FK constraint on users table)
-- Password for all users: "password123"
-- =====================================================
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token) VALUES
  -- Admin
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'admin@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Admin"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  -- Project Managers
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'pm@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Paula Manager"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', 'pm2@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos PM"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  -- Writers
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000000', 'writer@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"William Writer"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000000', 'writer2@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Wendy Writer"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-000000000000', 'writer3@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Walter Writer"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  -- Editors
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'editor@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emma Editor"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'editor2@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Edward Editor"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  -- Posters
  ('33333333-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', 'poster@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Peter Poster"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('44444444-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000000', 'poster2@seomonster.dev', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Poster"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  -- Clients
  ('55555555-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000000', 'client@vestige.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Victor Client"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
  ('66666666-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-000000000000', 'client@techflow.io', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tina Client"}', NOW(), NOW(), 'authenticated', 'authenticated', '');

-- Fix for Supabase auth: ensure string columns have empty strings not NULL
-- This prevents "converting NULL to string is unsupported" errors
UPDATE auth.users SET
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  recovery_token = COALESCE(recovery_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  confirmation_token = COALESCE(confirmation_token, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE email LIKE '%@seomonster.dev' OR email LIKE '%@vestige.com' OR email LIKE '%@techflow.io' OR email = 'admin@seomonster.dev';

-- =====================================================
-- COMPANIES
-- =====================================================
INSERT INTO companies (id, name, slug, website_url, is_active, seo_quota, blog_quota) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Vestige Digital', 'vestige', 'https://vestige.com', true, 6, 2),
  ('22222222-2222-2222-2222-222222222222', 'TechFlow Solutions', 'techflow', 'https://techflow.io', true, 8, 4),
  ('33333333-3333-3333-3333-333333333333', 'Green Energy Corp', 'greenenergy', 'https://greenenergy.com', true, 4, 2),
  ('44444444-4444-4444-4444-444444444444', 'Metro Law Group', 'metrolaw', 'https://metrolaw.com', true, 6, 2),
  ('55555555-5555-5555-5555-555555555555', 'Sunrise Medical', 'sunrise', 'https://sunrisemedical.com', true, 6, 3);

-- =====================================================
-- USERS (profiles linked to auth.users)
-- =====================================================
INSERT INTO users (id, email, full_name, role, is_active) VALUES
  -- Admin
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@seomonster.dev', 'Alex Admin', 'admin', true),
  -- Project Managers
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'pm@seomonster.dev', 'Paula Manager', 'project_manager', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'pm2@seomonster.dev', 'Carlos PM', 'project_manager', true),
  -- Writers
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'writer@seomonster.dev', 'William Writer', 'writer', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'writer2@seomonster.dev', 'Wendy Writer', 'writer', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'writer3@seomonster.dev', 'Walter Writer', 'writer', true),
  -- Editors
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'editor@seomonster.dev', 'Emma Editor', 'editor', true),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'editor2@seomonster.dev', 'Edward Editor', 'editor', true),
  -- Posters
  ('33333333-cccc-cccc-cccc-cccccccccccc', 'poster@seomonster.dev', 'Peter Poster', 'poster', true),
  ('44444444-dddd-dddd-dddd-dddddddddddd', 'poster2@seomonster.dev', 'Priya Poster', 'poster', true),
  -- Clients
  ('55555555-eeee-eeee-eeee-eeeeeeeeeeee', 'client@vestige.com', 'Victor Client', 'client', true),
  ('66666666-ffff-ffff-ffff-ffffffffffff', 'client@techflow.io', 'Tina Client', 'client', true);

-- =====================================================
-- USER-COMPANY RELATIONSHIPS
-- =====================================================
INSERT INTO user_companies (user_id, company_id) VALUES
  -- Admin has access to all
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555'),
  -- PM Paula handles Vestige and TechFlow
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222'),
  -- PM Carlos handles Green Energy, Metro Law, Sunrise
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555'),
  -- Clients
  ('55555555-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111'),
  ('66666666-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222');

-- =====================================================
-- CHECKLIST ITEMS
-- =====================================================
INSERT INTO checklist_items (id, name, description, sort_order, is_active) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'SEO Title Check', 'Make sure Title passes SEO check (50-60 characters, includes keyword)', 1, true),
  ('c2222222-2222-2222-2222-222222222222', 'Meta Description Check', 'Make sure Description passes SEO check (150-160 characters)', 2, true),
  ('c3333333-3333-3333-3333-333333333333', 'Image Names', 'Change the name of images on page to include Keyword', 3, true),
  ('c4444444-4444-4444-4444-444444444444', 'Internal Links', 'Add relevant internal links to other pages', 4, true),
  ('c5555555-5555-5555-5555-555555555555', 'Update Card Title', 'Add link to card and update title to POSTED format', 5, true),
  ('c6666666-6666-6666-6666-666666666666', 'URL Tracking', 'Add link to appropriate tab on the URL tracking sheet', 6, true);

-- =====================================================
-- KEYWORDS (using valid hex UUIDs)
-- =====================================================
-- Available keywords (not yet converted to articles)
INSERT INTO keywords (id, company_id, keyword_text, content_type, month_year, is_used, submitted_by) VALUES
  -- Vestige - Available
  ('a0000001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'employee body camera solutions', 'seo', 'DEC24', false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a0000002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'workplace surveillance systems', 'seo', 'DEC24', false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a0000003-0003-0003-0003-000000000003', '11111111-1111-1111-1111-111111111111', 'digital evidence management', 'seo', 'DEC24', false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a0000004-0004-0004-0004-000000000004', '11111111-1111-1111-1111-111111111111', 'The Future of Evidence Collection', 'blog', 'DEC24', false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  -- TechFlow - Available
  ('a0000005-0005-0005-0005-000000000005', '22222222-2222-2222-2222-222222222222', 'cloud migration services', 'seo', 'DEC24', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('a0000006-0006-0006-0006-000000000006', '22222222-2222-2222-2222-222222222222', 'kubernetes consulting', 'seo', 'DEC24', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('a0000007-0007-0007-0007-000000000007', '22222222-2222-2222-2222-222222222222', 'devops best practices 2024', 'blog', 'DEC24', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  -- Green Energy - Available
  ('a0000008-0008-0008-0008-000000000008', '33333333-3333-3333-3333-333333333333', 'commercial solar installation', 'seo', 'DEC24', false, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('a0000009-0009-0009-0009-000000000009', '33333333-3333-3333-3333-333333333333', 'solar panel efficiency guide', 'seo', 'DEC24', false, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  -- Metro Law - Available
  ('a000000a-000a-000a-000a-00000000000a', '44444444-4444-4444-4444-444444444444', 'personal injury lawyer near me', 'seo', 'DEC24', false, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('a000000b-000b-000b-000b-00000000000b', '44444444-4444-4444-4444-444444444444', 'workers compensation claims', 'seo', 'DEC24', false, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  -- Sunrise Medical - Available
  ('a000000c-000c-000c-000c-00000000000c', '55555555-5555-5555-5555-555555555555', 'urgent care vs emergency room', 'seo', 'DEC24', false, 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Used keywords (already converted to articles)
INSERT INTO keywords (id, company_id, keyword_text, content_type, month_year, is_used, used_at, submitted_by) VALUES
  ('a000000d-000d-000d-000d-00000000000d', '11111111-1111-1111-1111-111111111111', 'video surveillance compliance', 'seo', 'NOV24', true, NOW() - INTERVAL '15 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a000000e-000e-000e-000e-00000000000e', '11111111-1111-1111-1111-111111111111', 'evidence chain of custody', 'seo', 'NOV24', true, NOW() - INTERVAL '20 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('a000000f-000f-000f-000f-00000000000f', '22222222-2222-2222-2222-222222222222', 'aws vs azure comparison', 'seo', 'NOV24', true, NOW() - INTERVAL '10 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('a0000010-0010-0010-0010-000000000010', '22222222-2222-2222-2222-222222222222', 'microservices architecture benefits', 'blog', 'NOV24', true, NOW() - INTERVAL '25 days', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- =====================================================
-- ARTICLES
-- =====================================================
-- Published Articles
INSERT INTO articles (id, company_id, keyword_id, title, content_type, article_number, month_year, stage, google_doc_url, published_url, published_at, created_by) VALUES
  ('b0000001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'a000000d-000d-000d-000d-00000000000d',
   'Video Surveillance Compliance: A Complete Guide',
   'seo', 1, 'NOV24', 'published',
   'https://docs.google.com/document/d/example1',
   'https://vestige.com/blog/video-surveillance-compliance',
   NOW() - INTERVAL '5 days',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('b0000002-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222', 'a0000010-0010-0010-0010-000000000010',
   'The Benefits of Microservices Architecture',
   'blog', 1, 'NOV24', 'published',
   'https://docs.google.com/document/d/example2',
   'https://techflow.io/blog/microservices-benefits',
   NOW() - INTERVAL '8 days',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Assigned for Posting
INSERT INTO articles (id, company_id, keyword_id, title, content_type, article_number, month_year, stage, google_doc_url, created_by) VALUES
  ('b0000003-0003-0003-0003-000000000003', '11111111-1111-1111-1111-111111111111', 'a000000e-000e-000e-000e-00000000000e',
   'Understanding Evidence Chain of Custody',
   'seo', 2, 'NOV24', 'assigned_for_posting',
   'https://docs.google.com/document/d/example3',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('b0000004-0004-0004-0004-000000000004', '22222222-2222-2222-2222-222222222222', 'a000000f-000f-000f-000f-00000000000f',
   'AWS vs Azure: Which Cloud Platform is Right for You?',
   'seo', 1, 'NOV24', 'assigned_for_posting',
   'https://docs.google.com/document/d/example4',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Ready for Approval
INSERT INTO articles (id, company_id, title, content_type, article_number, month_year, stage, google_doc_url, created_by) VALUES
  ('b0000005-0005-0005-0005-000000000005', '33333333-3333-3333-3333-333333333333',
   'Benefits of Commercial Solar for Small Businesses',
   'seo', 1, 'DEC24', 'ready_for_approval',
   'https://docs.google.com/document/d/example5',
   'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('b0000006-0006-0006-0006-000000000006', '44444444-4444-4444-4444-444444444444',
   'What to Do After a Car Accident',
   'seo', 1, 'DEC24', 'ready_for_approval',
   'https://docs.google.com/document/d/example6',
   'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Ready for Editing
INSERT INTO articles (id, company_id, title, content_type, article_number, month_year, stage, google_doc_url, created_by) VALUES
  ('b0000007-0007-0007-0007-000000000007', '11111111-1111-1111-1111-111111111111',
   'How Body Cameras Improve Workplace Accountability',
   'seo', 3, 'DEC24', 'ready_for_editing',
   'https://docs.google.com/document/d/example7',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('b0000008-0008-0008-0008-000000000008', '22222222-2222-2222-2222-222222222222',
   'CI/CD Pipeline Best Practices',
   'seo', 2, 'DEC24', 'ready_for_editing',
   'https://docs.google.com/document/d/example8',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('b0000009-0009-0009-0009-000000000009', '55555555-5555-5555-5555-555555555555',
   'When to Visit an Urgent Care Center',
   'blog', 1, 'DEC24', 'ready_for_editing',
   'https://docs.google.com/document/d/example9',
   'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Needs Writing
INSERT INTO articles (id, company_id, title, content_type, article_number, month_year, stage, google_doc_url, created_by) VALUES
  ('b000000a-000a-000a-000a-00000000000a', '11111111-1111-1111-1111-111111111111',
   'Security Camera Installation Best Practices',
   'seo', 4, 'DEC24', 'needs_writing',
   'https://docs.google.com/document/d/example10',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('b000000b-000b-000b-000b-00000000000b', '22222222-2222-2222-2222-222222222222',
   'Docker vs Kubernetes: A Comparison',
   'seo', 3, 'DEC24', 'needs_writing',
   'https://docs.google.com/document/d/example11',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('b000000c-000c-000c-000c-00000000000c', '33333333-3333-3333-3333-333333333333',
   'Understanding Solar Tax Credits',
   'seo', 2, 'DEC24', 'needs_writing',
   'https://docs.google.com/document/d/example12',
   'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('b000000d-000d-000d-000d-00000000000d', '44444444-4444-4444-4444-444444444444',
   'How Long Do Personal Injury Cases Take?',
   'seo', 2, 'DEC24', 'needs_writing',
   NULL,
   'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('b000000e-000e-000e-000e-00000000000e', '55555555-5555-5555-5555-555555555555',
   'Preventive Health Screenings Everyone Needs',
   'seo', 1, 'DEC24', 'needs_writing',
   'https://docs.google.com/document/d/example13',
   'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- =====================================================
-- ARTICLE ASSIGNMENTS
-- =====================================================
-- Writers assigned to "Needs Writing" articles
INSERT INTO article_assignments (article_id, user_id, assigned_role, is_active) VALUES
  ('b000000a-000a-000a-000a-00000000000a', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'writer', true),
  ('b000000b-000b-000b-000b-00000000000b', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'writer', true),
  ('b000000c-000c-000c-000c-00000000000c', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'writer', true),
  ('b000000d-000d-000d-000d-00000000000d', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'writer', true),
  ('b000000e-000e-000e-000e-00000000000e', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'writer', true);

-- Editors assigned to "Ready for Editing" articles
INSERT INTO article_assignments (article_id, user_id, assigned_role, is_active) VALUES
  ('b0000007-0007-0007-0007-000000000007', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'editor', true),
  ('b0000008-0008-0008-0008-000000000008', '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'editor', true),
  ('b0000009-0009-0009-0009-000000000009', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'editor', true);

-- Completed writer assignments for articles past writing stage
INSERT INTO article_assignments (article_id, user_id, assigned_role, is_active, completed_at) VALUES
  ('b0000007-0007-0007-0007-000000000007', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'writer', false, NOW() - INTERVAL '3 days'),
  ('b0000008-0008-0008-0008-000000000008', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'writer', false, NOW() - INTERVAL '4 days'),
  ('b0000009-0009-0009-0009-000000000009', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'writer', false, NOW() - INTERVAL '2 days');

-- Posters assigned to "Assigned for Posting" articles
INSERT INTO article_assignments (article_id, user_id, assigned_role, is_active) VALUES
  ('b0000003-0003-0003-0003-000000000003', '33333333-cccc-cccc-cccc-cccccccccccc', 'poster', true),
  ('b0000004-0004-0004-0004-000000000004', '44444444-dddd-dddd-dddd-dddddddddddd', 'poster', true);

-- =====================================================
-- ARTICLE CHECKLIST (for posting stage articles)
-- =====================================================
-- Partial completion for article in posting stage
INSERT INTO article_checklist (article_id, checklist_item_id, completed_by, notes) VALUES
  ('b0000003-0003-0003-0003-000000000003', 'c1111111-1111-1111-1111-111111111111', '33333333-cccc-cccc-cccc-cccccccccccc', 'Title is 58 characters, includes keyword'),
  ('b0000003-0003-0003-0003-000000000003', 'c2222222-2222-2222-2222-222222222222', '33333333-cccc-cccc-cccc-cccccccccccc', 'Meta description is 155 characters'),
  ('b0000003-0003-0003-0003-000000000003', 'c3333333-3333-3333-3333-333333333333', '33333333-cccc-cccc-cccc-cccccccccccc', 'Updated 4 images with keyword'),
  ('b0000004-0004-0004-0004-000000000004', 'c1111111-1111-1111-1111-111111111111', '44444444-dddd-dddd-dddd-dddddddddddd', NULL),
  ('b0000004-0004-0004-0004-000000000004', 'c2222222-2222-2222-2222-222222222222', '44444444-dddd-dddd-dddd-dddddddddddd', NULL);

-- Full completion for published articles
INSERT INTO article_checklist (article_id, checklist_item_id, completed_by) VALUES
  ('b0000001-0001-0001-0001-000000000001', 'c1111111-1111-1111-1111-111111111111', '33333333-cccc-cccc-cccc-cccccccccccc'),
  ('b0000001-0001-0001-0001-000000000001', 'c2222222-2222-2222-2222-222222222222', '33333333-cccc-cccc-cccc-cccccccccccc'),
  ('b0000001-0001-0001-0001-000000000001', 'c3333333-3333-3333-3333-333333333333', '33333333-cccc-cccc-cccc-cccccccccccc'),
  ('b0000001-0001-0001-0001-000000000001', 'c4444444-4444-4444-4444-444444444444', '33333333-cccc-cccc-cccc-cccccccccccc'),
  ('b0000001-0001-0001-0001-000000000001', 'c5555555-5555-5555-5555-555555555555', '33333333-cccc-cccc-cccc-cccccccccccc'),
  ('b0000001-0001-0001-0001-000000000001', 'c6666666-6666-6666-6666-666666666666', '33333333-cccc-cccc-cccc-cccccccccccc'),
  ('b0000002-0002-0002-0002-000000000002', 'c1111111-1111-1111-1111-111111111111', '44444444-dddd-dddd-dddd-dddddddddddd'),
  ('b0000002-0002-0002-0002-000000000002', 'c2222222-2222-2222-2222-222222222222', '44444444-dddd-dddd-dddd-dddddddddddd'),
  ('b0000002-0002-0002-0002-000000000002', 'c3333333-3333-3333-3333-333333333333', '44444444-dddd-dddd-dddd-dddddddddddd'),
  ('b0000002-0002-0002-0002-000000000002', 'c4444444-4444-4444-4444-444444444444', '44444444-dddd-dddd-dddd-dddddddddddd'),
  ('b0000002-0002-0002-0002-000000000002', 'c5555555-5555-5555-5555-555555555555', '44444444-dddd-dddd-dddd-dddddddddddd'),
  ('b0000002-0002-0002-0002-000000000002', 'c6666666-6666-6666-6666-666666666666', '44444444-dddd-dddd-dddd-dddddddddddd');

-- =====================================================
-- ARTICLE HISTORY
-- =====================================================
-- Published article history
INSERT INTO article_history (article_id, user_id, action, from_stage, to_stage, created_at) VALUES
  ('b0000001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'created', NULL, 'needs_writing', NOW() - INTERVAL '30 days'),
  ('b0000001-0001-0001-0001-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'stage_change', 'needs_writing', 'ready_for_editing', NOW() - INTERVAL '25 days'),
  ('b0000001-0001-0001-0001-000000000001', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'stage_change', 'ready_for_editing', 'ready_for_approval', NOW() - INTERVAL '20 days'),
  ('b0000001-0001-0001-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'stage_change', 'ready_for_approval', 'assigned_for_posting', NOW() - INTERVAL '15 days'),
  ('b0000001-0001-0001-0001-000000000001', '33333333-cccc-cccc-cccc-cccccccccccc', 'stage_change', 'assigned_for_posting', 'published', NOW() - INTERVAL '5 days');

-- In-progress article history
INSERT INTO article_history (article_id, user_id, action, from_stage, to_stage, created_at) VALUES
  ('b0000003-0003-0003-0003-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'created', NULL, 'needs_writing', NOW() - INTERVAL '20 days'),
  ('b0000003-0003-0003-0003-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'stage_change', 'needs_writing', 'ready_for_editing', NOW() - INTERVAL '15 days'),
  ('b0000003-0003-0003-0003-000000000003', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'stage_change', 'ready_for_editing', 'ready_for_approval', NOW() - INTERVAL '10 days'),
  ('b0000003-0003-0003-0003-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'stage_change', 'ready_for_approval', 'assigned_for_posting', NOW() - INTERVAL '5 days');

-- Assignment history
INSERT INTO article_history (article_id, user_id, action, details, created_at) VALUES
  ('b000000a-000a-000a-000a-00000000000a', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'assignment',
   '{"assigned_user_id": "dddddddd-dddd-dddd-dddd-dddddddddddd", "assigned_user_name": "William Writer", "role": "writer"}',
   NOW() - INTERVAL '2 days'),
  ('b000000b-000b-000b-000b-00000000000b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'assignment',
   '{"assigned_user_id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "assigned_user_name": "Wendy Writer", "role": "writer"}',
   NOW() - INTERVAL '2 days');

-- Recent creation history
INSERT INTO article_history (article_id, user_id, action, to_stage, created_at) VALUES
  ('b0000007-0007-0007-0007-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'created', 'needs_writing', NOW() - INTERVAL '5 days'),
  ('b0000008-0008-0008-0008-000000000008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'created', 'needs_writing', NOW() - INTERVAL '6 days'),
  ('b000000a-000a-000a-000a-00000000000a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'created', 'needs_writing', NOW() - INTERVAL '2 days'),
  ('b000000b-000b-000b-000b-00000000000b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'created', 'needs_writing', NOW() - INTERVAL '2 days');

-- =====================================================
-- URL TRACKING (for published articles)
-- =====================================================
INSERT INTO url_tracking (article_id, company_id, published_url) VALUES
  ('b0000001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'https://vestige.com/blog/video-surveillance-compliance'),
  ('b0000002-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222', 'https://techflow.io/blog/microservices-benefits');

-- =====================================================
-- ARTICLE COMMENTS (Internal team discussion)
-- =====================================================
-- Comments on published article
INSERT INTO article_comments (article_id, user_id, content, created_at) VALUES
  ('b0000001-0001-0001-0001-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'Just finished the first draft. Added three new sections on GDPR compliance that I think will really help with the keyword rankings.',
   NOW() - INTERVAL '28 days'),
  ('b0000001-0001-0001-0001-000000000001', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Great work on the draft! I made some edits to the intro paragraph - it flows much better now. Also fixed a few grammar issues in section 2.',
   NOW() - INTERVAL '22 days'),
  ('b0000001-0001-0001-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Approved! The client mentioned they really wanted this one published before the end of the month. @Peter can you prioritize this for posting?',
   NOW() - INTERVAL '16 days'),
  ('b0000001-0001-0001-0001-000000000001', '33333333-cccc-cccc-cccc-cccccccccccc',
   'On it! Just finished the SEO checklist. All images renamed and meta tags are looking good. Publishing now.',
   NOW() - INTERVAL '5 days');

-- Comments on article in posting stage
INSERT INTO article_comments (article_id, user_id, content, created_at) VALUES
  ('b0000003-0003-0003-0003-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'This was a tricky topic to write about. Let me know if you need me to clarify any of the technical sections.',
   NOW() - INTERVAL '18 days'),
  ('b0000003-0003-0003-0003-000000000003', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'The technical sections are great! I added some internal links to our previous articles on evidence management.',
   NOW() - INTERVAL '12 days'),
  ('b0000003-0003-0003-0003-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Looking good. Approved for posting. Make sure to use the new featured image template for this one.',
   NOW() - INTERVAL '6 days'),
  ('b0000003-0003-0003-0003-000000000003', '33333333-cccc-cccc-cccc-cccccccccccc',
   'Working on it now. Quick question - should I use the standard CTA or the one specific to evidence management?',
   NOW() - INTERVAL '2 days'),
  ('b0000003-0003-0003-0003-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Use the evidence management CTA - it has a better conversion rate for this topic.',
   NOW() - INTERVAL '1 day');

-- Comments on article in editing stage
INSERT INTO article_comments (article_id, user_id, content, created_at) VALUES
  ('b0000007-0007-0007-0007-000000000007', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'Finished writing! This one came together really well. I included some case studies from the client''s existing customers.',
   NOW() - INTERVAL '4 days'),
  ('b0000007-0007-0007-0007-000000000007', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Nice work on the case studies! Starting my review now. I''ll have edits back to you by EOD.',
   NOW() - INTERVAL '3 days'),
  ('b0000007-0007-0007-0007-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Just reviewed - the content is solid. Emma, can you double-check the statistics in section 3? Want to make sure those are from credible sources.',
   NOW() - INTERVAL '2 days'),
  ('b0000007-0007-0007-0007-000000000007', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Good catch! I verified the stats and added proper citations. All sources are from 2023-2024 industry reports.',
   NOW() - INTERVAL '1 day');

-- Comments on TechFlow article in editing stage
INSERT INTO article_comments (article_id, user_id, content, created_at) VALUES
  ('b0000008-0008-0008-0008-000000000008', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'This was a fun one to write! CI/CD is such an important topic for their audience. Added some practical examples using GitHub Actions.',
   NOW() - INTERVAL '5 days'),
  ('b0000008-0008-0008-0008-000000000008', '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Great examples! I think we should also mention GitLab CI since that''s what TechFlow uses internally. Adding a section now.',
   NOW() - INTERVAL '3 days'),
  ('b0000008-0008-0008-0008-000000000008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'The GitLab section is a great addition. This is shaping up to be one of our best technical pieces.',
   NOW() - INTERVAL '1 day');

-- Comments on article needing writing
INSERT INTO article_comments (article_id, user_id, content, created_at) VALUES
  ('b000000a-000a-000a-000a-00000000000a', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Hey William, the client provided some specific points they want covered in this article. I''ll share the brief in the doc.',
   NOW() - INTERVAL '2 days'),
  ('b000000a-000a-000a-000a-00000000000a', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'Thanks Paula! Just saw the brief. I''ll have the first draft ready by Thursday.',
   NOW() - INTERVAL '1 day');

-- Comments on Solar article
INSERT INTO article_comments (article_id, user_id, content, created_at) VALUES
  ('b0000005-0005-0005-0005-000000000005', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
   'First draft is complete. I researched the latest solar incentives for small businesses - there are some great new tax credits for 2024.',
   NOW() - INTERVAL '8 days'),
  ('b0000005-0005-0005-0005-000000000005', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Excellent research! The tax credit information is really valuable. Made some minor edits for readability.',
   NOW() - INTERVAL '5 days'),
  ('b0000005-0005-0005-0005-000000000005', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'Ready for approval. This should perform well - it targets a high-intent keyword with good search volume.',
   NOW() - INTERVAL '3 days');

-- =====================================================
-- Done! The database is now populated with test data.
--
-- Test Users (all passwords: "password123"):
--   admin@seomonster.dev  - Admin
--   pm@seomonster.dev        - Project Manager
--   pm2@seomonster.dev       - Project Manager
--   writer@seomonster.dev    - Writer
--   writer2@seomonster.dev   - Writer
--   writer3@seomonster.dev   - Writer
--   editor@seomonster.dev    - Editor
--   editor2@seomonster.dev   - Editor
--   poster@seomonster.dev    - Poster
--   poster2@seomonster.dev   - Poster
--   client@vestige.com       - Client
--   client@techflow.io       - Client
-- =====================================================
