# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SEO content management platform built with Next.js 16, Supabase, TypeScript, and Vercel AI Gateway. Manages article workflows from keyword submission through publication with role-based access control and AI-powered content generation.

## Commands

```bash
npm run dev           # Start development server (port 3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint
npm run format        # Prettier format all files
npm run format:check  # Check formatting without writing
```

### Testing

```bash
npx playwright test                           # Run all tests (Mobile, Tablet, Desktop)
npx playwright test tests/responsive.spec.ts  # Run specific test file
npx playwright test --project=Desktop         # Run single viewport
npx playwright test --headed                  # Run with browser visible
```

Tests require local Supabase running (`npx supabase start`). Auth setup runs first, storing session in `tests/.auth/user.json`. Test credentials: `admin@seomonster.dev` / `password123`.

### Supabase

```bash
npx supabase start                    # Start local Supabase
npx supabase db reset                 # Reset database with migrations + seed
npx supabase gen types typescript --local > src/types/database.ts  # Regenerate types
```

## Architecture

### Supabase Client Pattern

- **Server components/API routes**: Use `createClient()` from `@/lib/server` (new instance per request, uses cookies)
- **Client components**: Use `createClient()` from `@/lib/client` (singleton)
- **Admin operations**: Use `createAdminClient()` from `@/lib/supabase-admin` (bypasses RLS)

### API Routes

All API routes use `getApiUser()` from `@/lib/api-auth` for authentication, which returns `{ id, role, companyIds }` or null.

### Data Fetching

React Query hooks in `@/hooks/queries/` handle all client-side data fetching. Query keys defined in `@/hooks/queries/keys.ts`.

### Article Workflow

Articles flow through stages defined in `@/lib/constants/stages.ts`:

1. `keyword_hopper` - Keywords awaiting article creation
2. `needs_writing` - Assigned to writers
3. `ready_for_editing` - Writer completed, needs editor
4. `ready_for_approval` - Editor completed, needs PM/admin approval
5. `assigned_for_posting` - Approved, waiting for publication
6. `published` - Live on client site

Stage transitions are role-restricted via `STAGE_TRANSITIONS` rules.

### User Roles

Defined in `@/lib/constants/roles.ts`: `admin`, `project_manager`, `writer`, `editor`, `poster`, `client`. Each has specific permissions checked via `checkPermission()`.

### UI Components

Uses shadcn/ui (new-york style) with Radix primitives. Components in `@/components/ui/`. Add new components: `npx shadcn@latest add <component>`.

### AI Content Generation

Uses Vercel AI Gateway with streaming to TipTap editor.

- **API Route**: `@/app/api/ai/generate/route.ts` - Handles streaming text generation
- **Prompts**: `@/lib/ai/prompts.ts` - SEO and blog content prompts with HTML output formatting
- **Dropdown**: `@/components/ai/ai-generate-dropdown.tsx` - Toolbar dropdown for generation options
- **Editor Integration**: `@/components/articles/article-editor.tsx` - TipTap with streaming support

**Generation Types:**

- `title` - Generates H1, replaces existing title or inserts at beginning
- `outline` - Generates article structure with H2/H3 headings
- `article` - Full article with proper HTML formatting
- `meta` - Meta title and description

**Insert Modes:**

- `replace` - Replaces all editor content (outline, article)
- `title` - Smart H1 replacement
- `append` - Adds to end of content (meta)

### Email (Resend + React Email)

Email templates are in `emails/` folder using React Email components:

- `base-layout.tsx` - Shared email layout wrapper
- `stage-change.tsx` - Stage transition notifications
- `assignment.tsx` - User assignment notifications
- `article-created.tsx` - New article notifications
- `article-published.tsx` - Published article notifications

**Testing emails:**

```bash
npx tsx scripts/test-email.ts  # Send test emails to Resend dashboard
```

Preview all email templates at `/dev/emails` when dev server is running.

**Test email addresses** (Resend):
- `delivered@resend.dev` - Simulates successful delivery
- `bounced@resend.dev` - Simulates bounce
- `complained@resend.dev` - Simulates spam complaint

### Integrations

- **Google Drive**: OAuth token storage in `integration_tokens`, file operations in `@/lib/google-drive.ts`
- **Slack**: Notifications via `@/lib/slack.ts` and `@/lib/notifications.ts`
- **Email**: React Email templates in `emails/`, sending via `@/lib/email.ts` with Resend
- **Vercel AI Gateway**: AI content generation via `AI_GATEWAY_API_KEY`, streams to TipTap editor

## Database

- Migrations in `supabase/migrations/`
- RLS policies in `00002_rls_policies.sql`
- Seed data in `supabase/seed.sql`
- Types generated from schema in `@/types/database.ts`

Key tables: `articles`, `companies`, `users`, `keywords`, `article_assignments`, `article_checklist`, `article_history`
