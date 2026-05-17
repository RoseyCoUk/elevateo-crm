# Soarx CRM

Agency war room. Hierarchical task flow, division ownership, approval queues. Not a Trello clone, not a Salesforce clone — an operating system for the company.

## Stack

- Next.js 15 (App Router, React Server Components, Server Actions)
- TypeScript + Tailwind v4
- Supabase: Postgres + Auth + RLS
- Zod for input validation
- Radix UI primitives

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project. Anywhere works; pick a region near you.

### 2. Apply the schema

In the Supabase dashboard → SQL Editor → New query, paste the contents of `supabase/migrations/0001_init.sql` and run it. That creates every table, the RLS policies, the hierarchy helper functions, and seeds the five divisions (Sales, Marketing, Technology, E-commerce, Admin).

### 3. Wire your env

```bash
cp .env.local.example .env.local
```

In Supabase → Project Settings → API, copy:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Publishable / anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

### 5. Create the first owner

1. Open `/signup` and create an account.
2. In Supabase → Table Editor → `users`, find your row and:
   - Set `role` to `owner`
   - Set `division_id` to the `admin` division (look in the `divisions` table)
3. Refresh. You now have full access, including the Admin sidebar.

From there, invite the rest of the team and use **Admin → Manage people** to set roles, divisions, and `manager_id` (this drives task authority).

## Architecture

```
COMPANY → DIVISIONS → CLIENTS → PROJECTS → TASKS → APPROVALS
                                              └── COMMENTS, ACTIVITY, NOTIFICATIONS
```

- **Divisions** — Sales, Marketing, Technology, E-commerce, Admin. Each has an owner.
- **Users** — Each has a `role`, `division_id`, and `manager_id`. The manager chain drives who can approve what.
- **Clients** — Account-level records with primary division and account lead.
- **Projects** — Belong to a client, owned by a division, led by a single person.
- **Tasks** — Live inside projects. Have an assignee and an optional reviewer. **A task with a reviewer cannot move to `done` without an approved approval row** — enforced in the DB.
- **Approvals** — The magic feature. Submitting for review creates a pending approval; the reviewer approves or rejects, which transitions the task.

## Key file map

```
src/app/
  (auth)/login, signup     — auth pages + server actions
  app/                     — authed shell; layout enforces session
    page.tsx               — dashboard (approvals + my tasks + activity)
    approvals/             — review queue
    tasks/                 — list, board, detail, comments, approval flow
    projects/              — list + detail (board view of tasks)
    clients/               — list + detail
    divisions/[code]/      — per-division view
    people/                — roster
    admin/                 — owner + admin-division-only
    inbox/                 — notifications
    settings/              — profile
supabase/migrations/       — schema, RLS, hierarchy helpers
```

## RLS-in-one-paragraph

`is_admin()` returns true for owners and admin-division members — they bypass most write restrictions. Reading is open to any authed user (the war-room ethos: visibility for everyone). Writing is gated by role: assignees/reviewers/leads can touch their thing. The `tasks_enforce_done` trigger blocks marking `done` unless an approved approval row exists, which is the entire point.

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve production build
```
