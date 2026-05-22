# Autoplay — ClientOps Dashboard

A full-stack internal operations dashboard built for **Autoplay**, an AI automation agency. Designed to give the team a single place to manage clients, projects, tasks, blockers, time tracking, assets, deliverables, and team members — replacing scattered spreadsheets, Notion docs, and WhatsApp threads.

---

## What It Does

Autoplay ClientOps gives the team complete visibility into every active client engagement:

| Module | What it tracks |
|---|---|
| **Dashboard** | Live stats, urgent blockers, client health, team hours chart, project status breakdown |
| **Clients** | Company info, contact details, health status, assigned owner, preferred communication channel |
| **Projects** | Progress %, status, team members, due dates, tags, linked client |
| **Tasks** | Kanban + table view, priorities, assignees, due dates, blocked/waiting states |
| **Time Logs** | Hours per team member per client/project, billable vs non-billable, weekly summaries |
| **Assets** | Google Docs, Sheets, Looms, contracts, brand files — pinnable, tagged, visibility-controlled |
| **Access Items** | Credential tracker (no raw passwords — references to 1Password/vault), status per service |
| **Blockers** | What's blocked, who needs to act, follow-up dates, impact level, resolution notes |
| **Deliverables** | What's been sent to the client, approval status, linked URLs |
| **Team** | Team profiles, skills, availability status, department, years of experience |
| **Settings** | Profile management, account preferences |
| **AI Updates** | AI-generated client update drafts (future feature) |
| **Reports** | Summary reporting (future feature) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL) |
| **Auth** | Supabase Auth (email/password) |
| **Styling** | Tailwind CSS v4 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Animation** | Framer Motion |
| **UI Primitives** | Radix UI |
| **Hosting** | Vercel (recommended) |

---

## Architecture

```
src/
├── app/
│   ├── (app)/              # Protected routes — requires login
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── time-logs/
│   │   ├── assets/
│   │   ├── access/
│   │   ├── blockers/
│   │   ├── deliverables/
│   │   ├── team/
│   │   ├── settings/
│   │   ├── reports/
│   │   └── ai-updates/
│   ├── (auth)/             # Public routes — login page
│   │   └── login/
│   └── actions/            # Server Actions (all DB mutations)
│       ├── clients.ts
│       ├── projects.ts
│       ├── tasks.ts
│       ├── time-logs.ts
│       ├── assets.ts
│       ├── access.ts
│       ├── blockers.ts
│       ├── deliverables.ts
│       └── profiles.ts
├── components/
│   ├── layout/             # Sidebar, Topbar
│   └── ui/                 # Avatar, Modal, Toast, StatusBadge, ProgressBar, MetricCard
└── lib/
    ├── supabase/           # Client, server, middleware, TypeScript types
    ├── demo-data.ts        # Mock data for demo mode (no Supabase needed)
    └── utils.ts
```

**Pattern:** Every page is a Server Component that fetches data and passes it as props to a `*-view.tsx` Client Component that handles UI state (search, filters, modals). All mutations go through `"use server"` action files with `revalidatePath` for cache invalidation.

---

## Database

14 tables managed in Supabase PostgreSQL:

`profiles` · `clients` · `projects` · `project_members` · `tasks` · `time_logs` · `client_assets` · `access_items` · `blockers` · `deliverables` · `approvals` · `timeline_entries` · `notifications` · `audit_logs`

Row Level Security (RLS) is enforced at the database level:
- **Admins** have full access to all data
- **Team members** only see clients and projects they are assigned to
- **Time logs** are private — users only see their own entries

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repo

```bash
git clone git@github.com:noumanejaz19/autoplay.git
cd autoplay
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_DEMO_MODE=false

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your keys from: **Supabase Dashboard → Settings → API**

### 3. Set up the database

In **Supabase Dashboard → SQL Editor**, run these two files in order:

**Step 1** — Creates all tables, indexes, and triggers:
```
supabase/migrations/001_initial_schema.sql
```

**Step 2** — Applies Row Level Security policies:
```
supabase/migrations/002_rls_policies.sql
```

### 4. Create your first admin user

In **Supabase Dashboard → Authentication → Users → Invite User**, enter your email.

Then run this in the SQL Editor to grant admin access:

```sql
update public.profiles
set role = 'admin'
where email = 'your@email.com';
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Mode

The app ships with a **demo mode** that runs entirely with mock data — no Supabase project or credentials needed. Perfect for client presentations or exploring the UI.

**Enable demo mode:**

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Demo mode pre-populates:
- 6 clients (Tongal Media, Global Supplier Outreach, MedReach Clinics, FrankBot Solutions, BuildRight Construction, ScaleUp Ventures)
- 6 projects with progress tracking and team members
- 9 tasks across Kanban statuses
- 7 time log entries across team members
- 5 assets (docs, sheets, brand files)
- 6 access items with credential statuses
- 4 open blockers
- 6 deliverables at various approval stages
- 5 team member profiles

Authentication is bypassed entirely and pages are statically pre-rendered at build time — the demo loads instantly.

**Disable demo mode:** Set `NEXT_PUBLIC_DEMO_MODE=false` and provide real Supabase credentials.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → **New Project** → import `noumanejaz19/autoplay`
3. Add all environment variables from `.env.local` in Vercel's project settings
4. Click **Deploy**

Vercel auto-deploys on every push to `main`.

### Other Platforms

Any platform that supports Next.js will work (Railway, Render, Fly.io). Set the same environment variables and run:

```bash
npm run build
npm run start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | Yes | `"true"` = mock data mode, `"false"` = live Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Production only | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production only | Supabase anon key — safe to expose in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Supabase service role key — **never expose client-side** |
| `NEXT_PUBLIC_APP_URL` | Optional | Your deployed app URL, used for auth redirects |

---

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build + TypeScript check
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Security

- All database access goes through Supabase Row Level Security — users cannot access data outside their scope even if they manipulate API calls directly
- The `SUPABASE_SERVICE_ROLE_KEY` is only used in server-side code and is never sent to the browser
- No raw passwords or credentials are stored in the database — the access items module stores vault references (e.g. "1Password - Client vault") only
- Auth sessions are managed via HTTP-only cookies through `@supabase/ssr`

---

## Built By

**Autoplay** — AI Automation Agency

[github.com/noumanejaz19](https://github.com/noumanejaz19)
