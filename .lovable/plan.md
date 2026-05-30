## Goal
Create a downloadable ZIP of the complete project source code (not the built/cPanel version) so you can hand it to another developer or import into another workspace.

## What will be included
- All `src/` files (pages, components, contexts, hooks, lib, assets)
- `supabase/` folder (edge functions + config.toml + migrations)
- `public/` folder
- Config files: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`, `postcss.config.js`, `components.json`, `eslint.config.js`, `index.html`
- Docs: `README.md`, `DEPLOY_CPANEL.md`, and the overview/prompt text files
- `.gitignore` and an `.env.example` (placeholder for Supabase keys)

## What will be excluded
- `node_modules/` (re-installed via `npm install`)
- `dist/` build output
- `.env` (contains live keys — replaced with `.env.example`)
- `.lovable/`, `.git/`, lock cache files

## Output
- File: `business-desk-pro-source.zip` saved to `/mnt/documents/`
- Delivered as a downloadable artifact in chat
- Includes a short `SETUP.md` with the 3 commands needed to run locally:
  1. `npm install`
  2. Copy `.env.example` → `.env` and fill Supabase keys
  3. `npm run dev`

Approve and I'll build the ZIP.