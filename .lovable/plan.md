

## Dashboard redesign + theme upgrade (keeping current purple base)

A focused visual overhaul that keeps your existing purple brand color but borrows the layout vibe, "floating panel" sidebar, abstract-decorated stat cards, dark mode toggle, and footer from your reference image.

### What you'll get

**1. Sidebar — floating "panel" look**
- The sidebar becomes a **rounded floating panel** (detached from screen edges, with margin around it and large rounded corners), instead of touching the viewport edge.
- Keeps the current purple gradient + white icons/labels.
- Compact user/workspace avatar block at the top (similar to the reference's profile block), with name + email under it.
- Same nav items and groups; active item still gets a white pill background.
- Subtle decorative abstract lines in the sidebar footer area for that "designed" feel.

**2. Stat cards (top of dashboard) — abstract + gradient**
- Each of the 6 stat cards (Income, Expense, Profit, Capital, Receivables, Payables) becomes a **colored gradient card** matching its tone (income=green grad, expense=rose grad, etc.).
- Light, decorative **abstract SVG pattern** in the background of each card (wavy lines / blob shape — subject-appropriate).
- A **small** icon (not big) sits in the top-right corner.
- Big white-text amount, small white/translucent label — same data, more visual weight.

**3. Dashboard background — abstract flourish**
- Soft, very low-opacity decorative blobs/shapes behind the dashboard (purple + amber tones blending into the existing `--background`). No clutter — only enough to give the page a "designed" feel like the reference.
- Existing chart card / recent transactions / donut / top clients / reminders sections **stay in the same positions** but get a slightly cleaner card style (a touch more rounded, lifted shadow on hover).

**4. Header upgrades**
- **POS button**: Added to the left of the notifications bell — a small icon button (shopping-cart icon) that navigates to `/pos`. Visible on all screen sizes.
- **Theme toggle**: Added to the right of the avatar — a sun/moon icon that switches between Light (default) and Dark mode. The choice is saved in `localStorage` so it persists across visits.
- Dark mode uses your existing `.dark` CSS variables (already defined in `index.css`) — just wired up to a toggle.

**5. App-wide footer (new)**
- A footer appears at the bottom of every authenticated page (inside `AppLayout`, below the main content).
- **Left**: Copyright text (e.g. "© 2026 FinTrack Pro. All rights reserved.").
- **Right**: A short contact text + a contact button (e.g. "Need help? — Contact us"), button is a link.
- Both texts and the button label/URL are **editable from Settings** under a new "Footer" section. Saved per organization in the database so each workspace can have its own.

**6. Settings — new "Footer" section**
- A new card on the Settings page (visible to org admins/owners) with 4 fields:
  - Copyright text
  - Contact text
  - Contact button label
  - Contact button URL (or `mailto:` / `tel:`)
- Save button persists to the database; footer updates instantly across the app.

---

### Technical details (for reference)

**Theme**
- Keep all existing CSS tokens; only add 3 new gradients (`--gradient-stat-income`, `--gradient-stat-expense`, etc. mapped to the 6 stat tones) and a few abstract SVG assets.
- Add a `ThemeProvider` context (`src/contexts/ThemeContext.tsx`) that toggles the `.dark` class on `<html>` and persists to `localStorage("theme")`. Default = light.

**Sidebar**
- Wrap `AppSidebar` in a container with `m-3 rounded-3xl overflow-hidden shadow-lift` so it floats. Adjust `AppLayout` flex/padding accordingly. Mobile drawer behavior preserved.

**Stat cards**
- Refactor `StatCard.tsx` to render a gradient background (per tone) + an absolute-positioned faint SVG pattern (`/src/assets/stat-pattern-*.svg`) + small icon top-right + white text. Keep the same props API so `Dashboard.tsx` doesn't change.
- Generate 2–3 lightweight SVG patterns (wave, dots, blob) and rotate them per tone.

**Dashboard background**
- In `Dashboard.tsx`, add an absolutely-positioned decorative layer (2–3 blurred radial gradients) behind the content with `pointer-events-none` and very low opacity, theme-aware.

**Header (`AppHeader.tsx`)**
- Add `<Link to="/pos">` icon button with `ShoppingCart` lucide icon, just before `<NotificationsBell />`.
- Add `<ThemeToggle />` button (Sun/Moon icon) just after the avatar dropdown trigger area (or between bell and avatar — placed on the right side as requested).

**Footer**
- New `src/components/layout/AppFooter.tsx`. Rendered inside `AppLayout` after `<main>`.
- Reads footer settings from a new `org_footer_settings` table (one row per org) via a small hook `useFooterSettings(orgId)`. Falls back to sensible defaults if no row exists.

**Database (Lovable Cloud migration)**
- New table `org_footer_settings`:
  - `organization_id uuid PK references organizations`
  - `copyright_text text`
  - `contact_text text`
  - `contact_button_label text`
  - `contact_button_url text`
  - `updated_at timestamptz default now()`
- RLS: any org member can SELECT; only owner/admin can INSERT/UPDATE (using existing `has_org_role` helper pattern).

**Settings page**
- Add a new "Footer" tab/section in `Settings.tsx` (admin/owner only), with the 4 inputs and a Save button using `supabase.from('org_footer_settings').upsert(...)`.

### Files touched

- **Created**:
  - `src/contexts/ThemeContext.tsx`
  - `src/components/layout/ThemeToggle.tsx`
  - `src/components/layout/AppFooter.tsx`
  - `src/hooks/useFooterSettings.ts`
  - `src/assets/stat-pattern-wave.svg`, `stat-pattern-dots.svg`, `stat-pattern-blob.svg`
  - Migration: `org_footer_settings` table + RLS
- **Edited**:
  - `src/index.css` (new gradient tokens, body background tweak)
  - `src/components/layout/AppLayout.tsx` (floating sidebar wrapper, footer render, theme provider)
  - `src/components/layout/AppSidebar.tsx` (floating panel styling, profile block tweak)
  - `src/components/layout/AppHeader.tsx` (POS button + theme toggle)
  - `src/components/dashboard/StatCard.tsx` (gradient + abstract pattern + small icon)
  - `src/pages/Dashboard.tsx` (decorative background layer behind content)
  - `src/pages/Settings.tsx` (new Footer settings section)
  - `src/main.tsx` (wrap app in `ThemeProvider`)

### Out of scope (intentionally)

- Sidebar nav items / groups stay the same.
- Dashboard sections (chart, donuts, recent, top clients, reminders) keep current positions and data — only card chrome is refreshed.
- No font change; staying with Inter to keep it consistent and snappy.

