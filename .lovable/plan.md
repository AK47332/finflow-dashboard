

# Multi-Tenant Architecture for FinTrack Pro (CodeCanyon Resale)

## Your Goal
You want to **sell FinTrack Pro to multiple clients** — each client should have their own isolated data ("separate clients, separate database"). Below are the realistic options, what they actually mean, and my recommendation.

## The Three Real Options

### Option A — Single hosted SaaS (one database, logical isolation) ⭐ Recommended for Lovable
You host **one** instance of the app. Every client signs up, gets their own account, and sees only their own data. Under the hood it's one database, but each row is tagged with an `organization_id` (or `user_id`) and Row-Level Security (RLS) guarantees clients can never see each other's data.

- **Pros:** One codebase, one deploy, one database to maintain. Updates ship to everyone instantly. This is how Stripe, Notion, Slack work. Fully buildable in Lovable Cloud today.
- **Cons:** All clients share infrastructure. If you want to physically separate a big client, you can't.
- **Best when:** You want to run FinTrack Pro as your own SaaS product and charge clients monthly.

### Option B — CodeCanyon "self-hosted" (each buyer installs their own copy)
This is what your original brief asked for: a buyer downloads a ZIP, installs it on **their own** PHP+MySQL hosting, and runs it themselves. Each buyer = their own server = their own database = total isolation.

- **Pros:** Perfect isolation. Buyer owns their data. Classic CodeCanyon model.
- **Cons:** **This is not what Lovable builds.** Lovable produces a React + Vite + Lovable Cloud (Supabase) app — not a Laravel/PHP app a shared-hosting buyer can install with a one-click installer. To deliver this, the app would need to be rewritten in Laravel + MySQL outside Lovable.
- **Best when:** You're committed to the CodeCanyon download-and-install model. **Requires leaving Lovable.**

### Option C — One Lovable project per client (manual multi-instance)
For each client you sell to, you duplicate the Lovable project, which gives them their own separate Lovable Cloud database. You hand them their own URL.

- **Pros:** Strong isolation per client, stays in Lovable.
- **Cons:** You manually clone and maintain N copies. Bug fixes must be applied N times. Doesn't scale past a handful of clients. Each client costs you a Lovable project.
- **Best when:** You have 2–5 high-value clients and want strong isolation without leaving Lovable.

## My Recommendation: Option A (Multi-Tenant SaaS)

Given you're building in Lovable, Option A is the only path that lets you (1) sell to many clients, (2) keep their data isolated, and (3) ship updates once. "Separate database per client" sounds safer than it is — properly enforced RLS gives you the same security guarantee with a fraction of the operational cost. This is the industry standard.

If your heart is set on the CodeCanyon downloadable-PHP-app model, we should stop and have that conversation now, because Lovable is the wrong tool for that specific goal.

## What Option A Looks Like in FinTrack Pro

```text
                ┌─────────────────────────────┐
                │   FinTrack Pro (one app)    │
                └──────────────┬──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
   Client A signs in     Client B signs in      Client C signs in
   sees only A's data    sees only B's data     sees only C's data
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               ▼
                  One Lovable Cloud database
              (every row tagged with organization_id;
               RLS blocks cross-tenant reads/writes)
```

**Tenancy model:** `organizations` (one per client company) → `organization_members` (users belonging to an org with a role: owner / admin / member) → all business tables (`incomes`, `expenses`, `clients`, `products`, etc.) carry an `organization_id` column protected by RLS.

## Implementation Plan (once you approve, I switch to build mode)

### Phase 1 — Foundation (multi-tenant + auth)
1. **Auth**: email + password, plus Google sign-in. Email confirmation off for easy testing.
2. **Tables**: `profiles`, `organizations`, `organization_members`, `app_role` enum (`owner`, `admin`, `member`), `has_role()` security-definer function, `current_org_id()` helper.
3. **Onboarding**: on first sign-in, user creates an organization (becomes owner) or accepts an invite.
4. **Migrate Income & Expense** off in-memory Zustand into Cloud tables with `organization_id` + RLS. Keep attachments in the existing buckets but namespace paths by `org_id/`.

### Phase 2 — Core business modules (CRUD + RLS, all org-scoped)
5. **Clients**, **Products**, **Services** — link from Income/Expense.
6. **Receivables** & **Payables** — auto-generated from partial-payment incomes/expenses.
7. **Capital** — owner contributions/withdrawals.

### Phase 3 — Productivity
8. **Notes**, **Reminders** (with browser notifications via the Notification API).

### Phase 4 — Insights & admin
9. **Reports** — P&L, income vs expense, by category/client, with PDF export.
10. **Settings** — business profile, currency, logo, manage categories, **invite team members** (admin/member roles).
11. **Activity logs** — append-only audit table.

### Phase 5 — Polish
12. Empty states, loading skeletons, mobile responsiveness, dashboard wired to live data.

## Technical Details (skip if non-technical)
- RLS pattern: every business table has `organization_id uuid not null`; SELECT/INSERT/UPDATE/DELETE policies all check `organization_id = public.current_org_id()` or `public.is_org_member(auth.uid(), organization_id)`.
- Roles stored in `organization_members(org_id, user_id, role)` — never on `profiles` (prevents privilege escalation).
- `has_role()` and `current_org_id()` are `SECURITY DEFINER` functions to avoid recursive RLS.
- Storage paths: `{org_id}/{uuid}.{ext}` so a future bucket policy can enforce per-org access.
- Stack stays: React 18 + Vite + Tailwind + Lovable Cloud (Supabase Postgres + Auth + Storage).

## Decision Needed From You
Reply with **A**, **B**, or **C**:
- **A** — Build it as a multi-tenant SaaS in Lovable (recommended; I start Phase 1 immediately).
- **B** — You actually need the downloadable PHP/MySQL CodeCanyon product; Lovable is the wrong tool and we should stop.
- **C** — One Lovable project per client; I'll explain the manual cloning workflow.

