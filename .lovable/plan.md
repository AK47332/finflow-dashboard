

## Landing/Auth flow: Login + Get a subscription

Replace the public root with a clean two-action portal. No public registration. New customers are redirected to your sales site.

---

### What changes

**1. Root URL (`/`)**
Replace the current marketing landing with a minimal portal that shows exactly two actions:

```text
┌─────────────────────────────────────────┐
│            FinTrack Pro logo            │
│                                         │
│      Welcome to FinTrack Pro            │
│   Manage your business finances         │
│                                         │
│   ┌───────────────┐ ┌─────────────────┐ │
│   │     Login     │ │ Get a subscription │
│   └───────────────┘ └─────────────────┘ │
│                                         │
│   Powered by BrownFoxIT                 │
└─────────────────────────────────────────┘
```

- **Login** → navigates to `/auth` (existing login page)
- **Get a subscription** → external redirect to `https://businessdeskpro.brownfoxit.com`

**2. `/auth` page**
- Remove the "Create account" tab entirely
- Show only the Login form (email + password + "Forgot password?")
- Replace any "Don't have an account? Sign up" link with: **"Need an account? Get a subscription →"** linking to `https://businessdeskpro.brownfoxit.com`
- Keep Google sign-in only if you want it; otherwise remove (confirm later)

**3. Old marketing landing**
- The existing `LandingPage` (hero, features, pricing, FAQ, footer) is removed from the `/` route
- Files stay in the codebase for now (in case you want them back), just unwired from the router

**4. Block direct signup attempts**
- Even if someone hits the old signup endpoint, the UI no longer exposes it
- Server-side public signup will be locked down later when we add the admin-managed user creation system (next phase)

---

### Files touched

- `src/App.tsx` — point `/` at the new portal page instead of `LandingPage`
- `src/pages/Portal.tsx` — **new** minimal portal page (Login + Get a subscription buttons)
- `src/pages/Auth.tsx` — remove signup tab, add "Get a subscription" link to BusinessDeskPro
- `src/components/marketing/*` — left untouched (unused for now)

---

### Technical details

- "Get a subscription" uses a plain `<a href="https://businessdeskpro.brownfoxit.com" target="_blank" rel="noopener noreferrer">` so it opens the sales site cleanly (new tab). If you'd rather replace the current tab, swap to `target="_self"` — tell me your preference, otherwise I'll default to **same tab** since it's a customer journey, not a reference link.
- Portal page reuses your existing dark theme + button styles for visual consistency with the app.
- Mobile responsive: buttons stack vertically below 480px.
- SEO meta on the portal: title "FinTrack Pro — Login or Get a subscription", description mirrors the value prop.
- No backend changes in this step. The full admin-managed account system + expiry hard-block will follow in the next plan once this portal is in place.

