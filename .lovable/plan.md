

## Where your cPanel upload files live

Short answer: **they don't exist yet**. You have to build them locally once. After that, you upload the contents of the generated `dist/` folder to cPanel.

---

### Step-by-step — get the files to upload

**1. Get the source code from Lovable**

Two options:

- **GitHub (recommended, easy updates later)**
  - In Lovable, top-right → **GitHub** → **Connect to GitHub**
  - After connecting, clone it on your computer:
    ```bash
    git clone https://github.com/<your-username>/<your-repo>.git
    cd <your-repo>
    ```

- **One-time ZIP download**
  - In Lovable, top-right → **Share** → **Download code**
  - Unzip it on your computer, then open a terminal inside the unzipped folder

**2. Install Node.js 18+ on your computer** (if you don't have it)
  - Download from https://nodejs.org (LTS version)

**3. Build the app**
  ```bash
  npm install
  npm run build
  ```

**4. Your upload files are now here:**
  ```
  <your-repo>/dist/
  ├── index.html          ← upload this
  ├── assets/             ← upload this whole folder
  │   ├── index-[hash].js
  │   ├── index-[hash].css
  │   └── ...
  └── favicon.ico         ← upload this
  ```

**Upload the CONTENTS of `dist/`** (not the `dist/` folder itself) into your cPanel `public_html/` directory.

**5. Add the `.htaccess` file** next to `index.html` in `public_html/` — the exact content is already in your project at `DEPLOY_CPANEL.md` (Step 4).

---

### Final cPanel layout

```text
public_html/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── favicon.ico
└── .htaccess
```

---

### Every time you publish new changes in Lovable

```bash
git pull           # pull latest from GitHub
npm install        # only if dependencies changed
npm run build      # regenerates dist/
```

Then re-upload `dist/` contents to cPanel, overwriting the existing files. Delete the old `assets/` folder first so stale chunks don't pile up.

---

### Why Lovable can't just hand you a ready `dist.zip`

The build has to run after every code change, and it uses your `.env` values (Supabase URL + anon key) baked into the JS bundle at build time. Running `npm run build` locally is the step that produces your final, deployable files. It takes about 30–60 seconds.

---

### Easier alternative — skip cPanel entirely

If the `npm install` + build + FTP loop feels like too much overhead, Lovable's built-in **Publish** button (top-right of the editor) gives you:
- A live `.lovable.app` URL in one click
- Option to connect your custom domain (`app.yourdomain.com`) with automatic SSL
- Auto-redeploys every time you hit Publish — no local build needed

Your backend stays on Lovable Cloud either way, so Publish vs cPanel is purely a choice about where the static frontend files are served from.

---

### Reference

The full cPanel guide already exists in your project: open `DEPLOY_CPANEL.md` in the file tree — it has the `.htaccess` content, SSL setup, optional auto-deploy via `.cpanel.yml`, and troubleshooting.

