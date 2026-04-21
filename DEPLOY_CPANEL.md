# Self-hosting FinTrack Pro on cPanel

This guide covers deploying the **frontend** to your own cPanel hosting while
keeping the **backend** (database, auth, edge functions, storage) on Lovable
Cloud. This is the recommended setup — zero backend ops, your own domain.

---

## What you're deploying

- ✅ **Frontend (React SPA)** → cPanel `public_html/`
- ❌ **Backend** → stays on Lovable Cloud (cannot move to cPanel)

The frontend is a static bundle (HTML + JS + CSS). It talks to Lovable Cloud
over HTTPS using the public anon key baked into the build.

---

## Step 1 — Get the source code

In Lovable, click **GitHub → Connect to GitHub**, then clone your repo locally:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

Alternatively: **Share → Download code** for a one-time ZIP.

---

## Step 2 — Build locally

You need Node.js 18+ installed.

```bash
npm install
npm run build
```

This produces a `dist/` folder containing:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── favicon.ico
```

The Supabase URL + anon key are automatically baked in from `.env`. These are
**public-safe** credentials — RLS policies enforce security server-side.

---

## Step 3 — Upload to cPanel

1. Log into cPanel → **File Manager**
2. Navigate to `public_html/` (or a subdomain folder like `public_html/app/`)
3. Upload **the contents of `dist/`** (not the `dist/` folder itself)
4. Or use FTP/SFTP with your favorite client (FileZilla, Cyberduck)

The final structure should look like:

```
public_html/
├── index.html
├── assets/
├── favicon.ico
└── .htaccess         ← create this next
```

---

## Step 4 — Create `.htaccess` for SPA routing

Without this file, refreshing `/dashboard` or any deep link will return a 404.

Create a file named `.htaccess` in the same folder as `index.html` with this
content:

```apache
# Enable rewrite engine
RewriteEngine On
RewriteBase /

# Force HTTPS (optional but recommended)
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA fallback — send all non-file, non-directory requests to index.html
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static assets aggressively (hashed filenames)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Don't cache index.html — always fetch latest
<IfModule mod_headers.c>
  <FilesMatch "index\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>

  # Security headers
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
```

If your app lives in a subfolder (e.g. `public_html/app/`), change `RewriteBase /`
to `RewriteBase /app/` and `RewriteRule . /index.html [L]` to
`RewriteRule . /app/index.html [L]`.

---

## Step 5 — Enable SSL

In cPanel:

1. Go to **SSL/TLS Status** (or **AutoSSL**)
2. Run AutoSSL on your domain — this provisions a free Let's Encrypt cert
3. Wait a few minutes for issuance

Once done, the HTTPS redirect in `.htaccess` will kick in automatically.

---

## Step 6 — Verify

Visit `https://yourdomain.com` — you should see the landing page.

Test:
- [ ] Landing page loads
- [ ] Refresh `/auth` directly → should load (not 404)
- [ ] Sign up with a new email → creates account in Lovable Cloud
- [ ] Sign in → redirects to `/onboarding`
- [ ] Create an org → lands on `/dashboard`
- [ ] Refresh `/dashboard` → should load (not 404)

---

## Updating the deployed app

Whenever you publish changes in Lovable:

```bash
git pull
npm install      # only if dependencies changed
npm run build
# Upload new dist/ contents to cPanel, overwriting existing files
```

Tip: delete the old `assets/` folder before uploading new one — old hashed
chunks will otherwise linger.

---

## Automating deploys (optional)

If your cPanel supports **Git Version Control** (most do):

1. In cPanel → **Git Version Control** → Create repo pointing at your GitHub
2. Add a `.cpanel.yml` in the repo root:

```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/yourusername/public_html/
    - /bin/cp -R dist/* $DEPLOYPATH
```

3. Run `npm run build` locally, commit `dist/`, push — cPanel auto-deploys

Alternatively use a GitHub Action to SFTP `dist/` on every push to `main`.

---

## Backend stays on Lovable Cloud

Your frontend on cPanel will make API calls to:

```
https://wbnaognhtokxoowyseqg.supabase.co
```

This is configured automatically via the `VITE_SUPABASE_URL` env var at build
time. **CORS is already open** — no extra config needed on the backend side.

Data, users, files, and edge functions all live on Lovable Cloud. You manage
them from the Lovable editor under **Cloud** view.

---

## Troubleshooting

**Blank page after deploy**
- Open browser devtools → Console. Usually a path issue — ensure `index.html`
  and `assets/` are siblings at the cPanel root.

**404 on refresh of any route except `/`**
- `.htaccess` missing or `mod_rewrite` disabled. Contact your host to enable
  Apache mod_rewrite (standard on almost all cPanel hosts).

**CORS errors in console**
- Shouldn't happen — Lovable Cloud allows all origins. If it does, check that
  you're hitting HTTPS (not HTTP) on both sides.

**"Invalid API key" errors**
- The `.env` values weren't included in the build. Re-run `npm run build` and
  confirm `dist/assets/index-*.js` contains your Supabase URL (search the file).

**Styling broken**
- Clear browser cache. Hashed filenames should prevent this but some hosts
  serve stale cached HTML.

---

## Alternative: Lovable's built-in Publish

Before going through cPanel, consider Lovable's one-click **Publish**:

- ✅ Free `.lovable.app` subdomain
- ✅ Custom domain support (paid plans)
- ✅ Auto SSL, auto SPA routing, auto deploys on every Lovable edit
- ✅ No build step, no file upload
- ❌ Hosting controlled by Lovable (not your cPanel)

For most users this is easier. Use cPanel only if you have a specific reason
(existing infrastructure, compliance, contractual hosting requirements).