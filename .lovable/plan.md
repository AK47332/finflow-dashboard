

## Goal
Add a one-click "Download source code (ZIP)" button inside the admin area so you can grab the entire frontend + edge functions + migrations as a single archive without going through GitHub.

## How it will work

A new edge function (`download-source-zip`) runs server-side, walks the project directory it's deployed alongside, packages every relevant file into a ZIP in memory, and streams it back as `application/zip`. A button in the admin UI calls the function and triggers a browser download.

Because edge functions only have access to their own bundled files (not the full repo), the function will read source from a **GitHub archive endpoint** instead. The flow:

1. Admin clicks **Download source (ZIP)**.
2. Frontend calls the `download-source-zip` edge function.
3. Function fetches `https://api.github.com/repos/{owner}/{repo}/zipball/{branch}` using a stored `GITHUB_TOKEN` + `GITHUB_REPO` secret.
4. Function streams the ZIP back to the browser, which saves it as `fintrack-source-YYYYMMDD.zip`.

This means the project must be connected to GitHub at least once (one-time setup). After that, every download is one click.

## What gets built

**Backend**
- New edge function `supabase/functions/download-source-zip/index.ts`
  - Verifies the caller is a super admin
  - Reads `GITHUB_TOKEN`, `GITHUB_REPO` (e.g. `user/repo`), `GITHUB_BRANCH` (default `main`) from secrets
  - Fetches the GitHub zipball, streams response back with `Content-Disposition: attachment; filename="..."`
- Register secrets via `add_secret` for `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`

**Frontend**
- New section in `src/pages/admin/Customers.tsx` (or a new `src/pages/admin/SourceDownload.tsx` page added to sidebar under Admin) titled **Source code backup**
  - One button: **Download source (ZIP)**
  - Shows a tooltip if GitHub is not yet connected, with a short setup checklist
  - Uses `supabase.functions.invoke('download-source-zip')` and saves the blob via `URL.createObjectURL`
- Sidebar entry: **Admin → Source backup** (super admin only)

## One-time setup you'll do (guided in the UI)

1. Connect the project to GitHub once (Connectors → GitHub → Create Repository) — already documented.
2. Create a fine-grained GitHub Personal Access Token with **Contents: read** on that repo.
3. Paste token + `owner/repo` into the secrets prompt that appears the first time you click the button.

After that: one click = ZIP download, every time, with the latest code.

## Technical notes

- We use GitHub's zipball endpoint instead of bundling files server-side because edge functions don't have filesystem access to the project repo.
- Fallback we considered (and rejected): bundling source into the function at deploy time — this would inflate every deploy and the ZIP would go stale between deploys.
- The downloaded ZIP includes everything in the GitHub repo: `src/`, `supabase/functions/`, `supabase/migrations/`, configs, package files. It does NOT include uploaded storage files (logos, product images) or database rows — those need separate exports as previously explained.
- File naming: `fintrack-source-{YYYYMMDD-HHmm}.zip`.
- Access: gated to super admins only via the existing `useSuperAdmin` hook + server-side role check.

