

## How to test the app + self-host on cPanel

Two separate things to cover: (1) how to log in and test everything now, and (2) how to install this on your own cPanel hosting.

---

### Part 1 — How to test without existing login info

You don't need pre-existing credentials. The app has self-serve signup. Here's the fastest path:

**Option A — Create a test account (recommended)**
1. Open the preview at `/auth`
2. Click the **"Create account"** tab
3. Enter any email (e.g. `test@example.com`), any full name, and a password (6+ chars)
4. Submit — this creates a real account in your Lovable Cloud backend
5. You'll be redirected to `/onboarding` to create your first workspace
6. After onboarding you land on `/dashboard` with full access

**Option B — Use Google sign-in**
- Click **"Continue with Google"** on `/auth` — works if Google provider is already enabled in Lovable Cloud

**Important note about email confirmation**
- By default, Lovable Cloud requires email verification before first login. If signup succeeds but sign-in fails with "email not confirmed," we have two choices:
  - **Quick fix for testing:** I disable email confirmation in auth settings so you can log in immediately (one toggle, ~10 seconds)
  - **Proper fix:** set up the email domain (Phase 7) so verification emails actually send

For testing today, I recommend the quick fix — I'll disable email confirmation when we switch to build mode.

**Landing page (no login needed)**
- The public marketing page at `/` requires no auth — visit it directly to review the landing design

---

### Part 2 — Installing on your own cPanel

**The short answer: yes, you can self-host the frontend on cPanel, but the backend cannot move to cPanel.**

Here's the honest breakdown:

**What CAN go on cPanel**
- The **frontend** (the React app) — it compiles to static HTML/CSS/JS and runs on any cPanel hosting with no Node.js required
- Process:
  1. In Lovable, click **Share → Download code** (or connect GitHub) to get the source
  2. On your local machine run `npm install` then `npm run build` — produces a `dist/` folder
  3. Upload the contents of `dist/` to your cPanel `public_html/` via File Manager or FTP
  4. Add a `.htaccess` file in `public_html/` for SPA routing (so `/dashboard` refreshes don't 404)
  5. The `.env` values (Supabase URL + anon key) get baked into the build — they're public-safe

**What CANNOT go on cPanel**
- The **backend** — database, auth, edge functions, file storage. This all lives on Lovable Cloud (Supabase under the hood) and cannot be moved to cPanel. cPanel's MySQL + PHP stack is not compatible with Postgres + Deno edge functions.
- **Options for the backend:**
  - **Keep it on Lovable Cloud** (easiest) — the frontend on your cPanel just calls the Lovable Cloud API. This works today with zero extra work.
  - **Self-host Supabase on a VPS** (NOT cPanel — needs Docker). Requires a VPS from the same provider or DigitalOcean/Hetzner. I can generate the migration files and a docker-compose setup. Much more work.
  - **Rewrite backend for cPanel (PHP + MySQL)** — not recommended. Would require rebuilding auth, RLS, edge functions from scratch. Weeks of work. Loses most of what makes the app reliable.

**Recommended path for you**
1. Frontend on your cPanel domain (e.g. `app.yourdomain.com`)
2. Backend stays on Lovable Cloud (free tier is generous, scales with usage)
3. Custom domain points to cPanel; cPanel serves the static build; app talks to Lovable Cloud API in the background
4. Users never see or know about Lovable Cloud — it's just your API

---

### What I need from you to proceed

```
1. Testing: Should I disable email confirmation now so you can sign up
   and log in immediately? (Recommended — re-enable when we do Phase 7)

2. cPanel deployment: Do you want me to prepare a self-hosting guide
   now (build instructions + .htaccess + cPanel upload steps), or
   later after Phase 8/9 are done?

3. Backend hosting: Confirm you're OK keeping the backend on Lovable
   Cloud (recommended) vs self-hosting Supabase on a VPS (big extra
   work). This is NOT the same as cPanel.
```

### Technical details (for reference)

- Build output: Vite produces static assets in `dist/` — HTML entry + hashed JS/CSS chunks. No server-side rendering, no Node runtime needed at host.
- `.htaccess` for SPA fallback on Apache (cPanel default):
  ```text
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
  ```
- Env vars at build time: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — these are public-safe anon credentials, fine to ship in a static bundle.
- CORS: Lovable Cloud backend accepts requests from any origin by default, so your cPanel domain will work without config.
- SSL: use cPanel's free AutoSSL / Let's Encrypt on your custom domain.
- Alternative to cPanel: publishing via Lovable's built-in Publish is one click, gives you `yourproject.lovable.app` + optional custom domain + auto SSL + SPA routing already handled. Worth considering before cPanel.

