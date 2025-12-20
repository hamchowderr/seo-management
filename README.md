# SEO Monster

Content workflow management system for SEO agencies to manage keyword research, article creation, editing, approval, and publishing across multiple clients.

Built with Next.js 16, Supabase, and TypeScript.

## Features

- **6-Stage Workflow Pipeline**: Keywords flow through Hopper → Writing → Editing → Approval → Posting → Published
- **Role-Based Access Control**: Admin, Project Manager, Writer, Editor, Poster, and Client roles with granular permissions
- **Google Drive Integration**: Auto-creates Google Docs with organized folder structure per client/month
- **Slack & Email Notifications**: Configurable alerts for stage changes, assignments, and publications
- **Client Portal**: Simplified view for clients to track article progress and access published content
- **Reporting Dashboard**: Visual metrics on articles published, pipeline status, and performance by client
- **Rich Text Editor**: Tiptap-powered editor with AI content generation (streaming, smart insertion)
- **Kanban Board**: Drag-and-drop article management across workflow stages

## User Roles

| Role            | Permissions                                                    |
| --------------- | -------------------------------------------------------------- |
| Admin           | Full access including user and company management              |
| Project Manager | Full access except user management                             |
| Writer          | View assigned articles, write content, move to Editing         |
| Editor          | Edit articles, send to Approval or back to Writing             |
| Poster          | View all articles, complete posting checklist, publish         |
| Client          | Submit keywords, view article progress, access published links |

## Workflow Stages

1. **Keyword Hopper** - Pool of available keywords by client
2. **Needs Writing** - Keyword selected, Google Doc created, assigned to writer
3. **Ready for Editing** - Draft complete, assigned to editor
4. **Ready for Approval** - Edited, awaiting PM/Admin approval
5. **Assigned for Posting** - Approved, ready to publish with checklist
6. **Published** - Live on client website

## Content Types

- **SEO Articles** - Designed to rank for search engines (default quota: 6/month)
- **Blog Articles** - Authoritative thought pieces (default quota: 2/month)

Quotas are configurable per company.

## Naming Conventions

Article titles are auto-generated following this format:

```
{COMPANY} {TYPE} {#} - {Title} - {MONYY}
```

Example: `Vestige SEO 3 - Employee Body Camera Solutions - DEC25`

After publishing:

```
POSTED-{MONYY} - {COMPANY} {TYPE} {#} - {Title}
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- Google Cloud Console project (for Drive integration)
- Slack App (for notifications)
- Resend account (for email notifications)
- Vercel account with AI Gateway access (for AI content generation)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/hamchowderr/seo-monster.git
   cd seo-monster
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Configure your `.env.local`:

   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

   # Google Drive
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

   # Slack
   SLACK_BOT_TOKEN=<your-bot-token>
   SLACK_SIGNING_SECRET=<your-signing-secret>

   # Email (Resend)
   RESEND_API_KEY=<your-api-key>

   # AI - Vercel AI Gateway (Optional)
   AI_GATEWAY_API_KEY=<your-api-key>
   ```

5. Start local Supabase:

   ```bash
   npx supabase start
   ```

6. Run database migrations and seed:

   ```bash
   npx supabase db reset
   ```

7. Start the development server:

   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000)

### Test Credentials

After seeding, you can log in with:

- **Email**: `admin@seomonster.dev`
- **Password**: `password123`

> **Important for Slack Integration**: The admin email in the seed data should match your Slack workspace email. Update `admin@seomonster.dev` in `supabase/seed.sql` to your actual email address so that Slack can automatically look up your user ID and send you direct message notifications.

## Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Testing

```bash
npx playwright test                           # Run all tests
npx playwright test tests/responsive.spec.ts  # Run specific test file
npx playwright test --project=Desktop         # Run single viewport
npx playwright test --headed                  # Run with browser visible
```

Tests require local Supabase running. Auth setup runs first, storing session in `tests/.auth/user.json`.

## Production Deployment

### Vercel Environment Variables

Add these environment variables in your Vercel project settings:

#### Required

| Variable                                       | Where to Get It                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase Dashboard → Project Settings → API → Project URL         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY`                    | Supabase Dashboard → Project Settings → API → `service_role` key  |
| `NEXT_PUBLIC_APP_URL`                          | Your production URL (e.g., `https://yourdomain.com`)              |

#### Integrations

| Variable               | Where to Get It                                          | Enables                   |
| ---------------------- | -------------------------------------------------------- | ------------------------- |
| `GOOGLE_CLIENT_ID`     | Google Cloud Console → APIs & Services → Credentials     | Google Drive article docs |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials     | Google Drive article docs |
| `GOOGLE_REDIRECT_URI`  | Set to `https://yourdomain.com/api/auth/google/callback` | Google Drive OAuth        |
| `SLACK_BOT_TOKEN`      | api.slack.com/apps → Your app → OAuth & Permissions      | Team notifications        |
| `RESEND_API_KEY`       | resend.com dashboard                                     | Email notifications       |
| `RESEND_FROM_EMAIL`    | Your verified sender email                               | Email sender address      |
| `AI_GATEWAY_API_KEY`   | Vercel Dashboard → AI Gateway → API Keys                 | AI content generation     |

> **Note:** While the app will run without these, core features like automatic Google Doc creation, notifications, and AI writing assistance will be disabled.

### Supabase Cloud Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your project reference** from the URL:
   - Your project URL looks like: `https://app.supabase.com/project/abcdefghijklmnop`
   - The project-ref is: `abcdefghijklmnop`

3. **Link your local project to Supabase cloud**:

   ```bash
   npx supabase login                              # Login to Supabase CLI
   npx supabase link --project-ref <your-project-ref>
   ```

4. **Deploy database migrations**:

   ```bash
   npx supabase db push                            # Push all migrations to cloud
   ```

5. **Seed the database** (optional - for initial data):

   ```bash
   # Connect to your cloud database and run seed
   psql <your-database-connection-string> -f supabase/seed.sql
   ```

   Or manually via Supabase Dashboard → SQL Editor → paste contents of `supabase/seed.sql`

6. **Get your API keys** from Supabase Dashboard → Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

7. **Configure Authentication URLs** in Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: Add `https://yourdomain.com/**`

8. **Create an admin user**:
   - Go to Supabase Dashboard → Authentication → Users → Add User
   - After creating, go to Table Editor → `users` table
   - Update the user's `role` to `admin`

### Supabase Commands Reference

```bash
# Local Development
npx supabase start                    # Start local Supabase
npx supabase stop                     # Stop local Supabase
npx supabase db reset                 # Reset with migrations + seed

# Cloud Deployment
npx supabase login                    # Login to Supabase CLI
npx supabase link --project-ref <ref> # Link to cloud project
npx supabase db push                  # Push migrations to cloud
npx supabase db pull                  # Pull remote schema changes

# Type Generation
npx supabase gen types typescript --local > src/types/database.ts   # From local
npx supabase gen types typescript --linked > src/types/database.ts  # From cloud
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, etc.)
│   ├── (dashboard)/       # Main app pages
│   │   ├── articles/      # Article management
│   │   ├── client-portal/ # Client-facing views
│   │   ├── companies/     # Company management
│   │   ├── keywords/      # Keyword hopper
│   │   ├── reports/       # Analytics dashboard
│   │   └── users/         # User management
│   ├── (dev)/             # Development tools
│   │   └── dev/emails/    # Email template preview
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── articles/         # Article-related components
│   ├── keywords/         # Keyword components
│   └── ...
├── hooks/                # Custom React hooks
│   └── queries/          # React Query hooks
├── lib/                  # Utility functions
│   ├── constants/        # App constants (roles, stages, etc.)
│   ├── client.ts         # Supabase browser client
│   ├── server.ts         # Supabase server client
│   ├── google-drive.ts   # Google Drive integration
│   ├── slack.ts          # Slack integration
│   ├── email.ts          # Email integration (Resend)
│   └── notifications.ts  # Notification dispatcher
└── types/                # TypeScript types
    └── database.ts       # Generated Supabase types

emails/                   # React Email templates
├── base-layout.tsx       # Shared email layout
├── stage-change.tsx      # Stage transition email
├── assignment.tsx        # User assignment email
├── article-created.tsx   # New article email
└── article-published.tsx # Published article email

scripts/
└── test-email.ts         # Email testing script

supabase/
├── migrations/           # Database migrations
└── seed.sql             # Seed data
```

## Integrations

### Google Drive

Articles are automatically created as Google Docs in an organized folder structure:

```
/SEO Monster/
  /{Company Name}/
    /{MONYY}/
      - Article Title - MONYY.gdoc
```

OAuth tokens are stored securely and refreshed automatically.

### Slack

- Channel notifications for stage changes and new articles
- Direct messages for user assignments
- One channel per client (e.g., `#vestige-content`)

### Email

Email notifications via Resend with React Email templates in the `emails/` folder:

- **Stage Change** - Notifications when articles move between workflow stages
- **Assignment** - Alerts when users are assigned to articles
- **Article Created** - Notifications for new articles
- **Article Published** - Confirmations when articles go live

**Testing emails locally:**

```bash
npx tsx scripts/test-email.ts  # Send test emails to Resend dashboard
```

Preview email templates at `http://localhost:3000/dev/emails` when running the dev server.

**Resend test addresses** (for development):
- `delivered@resend.dev` - Simulates successful delivery
- `bounced@resend.dev` - Simulates email bounce
- `complained@resend.dev` - Simulates spam complaint

Users can configure their notification preference (Email, Slack, or Both) in their profile.

## Database

The application uses Supabase (PostgreSQL) with Row Level Security (RLS) policies for data protection.

### Key Tables

- `companies` - Client companies with quotas and integration settings
- `users` - User accounts with roles and notification preferences
- `keywords` - Keyword hopper entries
- `articles` - Main article records with workflow state
- `article_assignments` - User-to-article assignments by role
- `article_checklist` - Posting checklist completion tracking
- `article_history` - Audit log of all changes

### Regenerating Types

After schema changes, regenerate TypeScript types:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix primitives
- **Editor**: Tiptap
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Testing**: Playwright
- **Email**: Resend
- **AI**: Vercel AI Gateway with streaming (optional)

## License

MIT License - See [LICENSE](LICENSE) for details.
