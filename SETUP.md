# Business Desk Pro — Local Setup

## Requirements
- Node.js 18+ and npm

## Steps
1. Install dependencies:
   ```
   npm install
   ```
2. Copy environment file and fill in your Supabase (Lovable Cloud) credentials:
   ```
   cp .env.example .env
   ```
   Then edit `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

3. Run the dev server:
   ```
   npm run dev
   ```

4. Build for production:
   ```
   npm run build
   ```
   Output goes to `dist/`. See `DEPLOY_CPANEL.md` for cPanel deployment.

## Backend
Supabase edge functions live in `supabase/functions/`. Deploy with the Supabase CLI or re-import the project into Lovable to auto-deploy.
