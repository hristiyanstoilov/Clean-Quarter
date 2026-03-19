# Deployment Guide

**Live site:** https://cleanquarter.netlify.app
**Hosting:** Netlify (auto-deploy from `main` branch on GitHub)

> For full step-by-step pre-deploy checklist see [`docs/PRE_DEPLOY_CHECKLIST.md`](PRE_DEPLOY_CHECKLIST.md).

---

## Prerequisites

- Node.js 18+
- Supabase project (free tier is sufficient)
- Netlify account connected to the GitHub repository

---

## Environment Variables

Set these in **Netlify Dashboard → Site settings → Environment variables**:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Variable names **must** start with `VITE_` — Vite replaces them at build time.

> Never commit `.env.local` — it is in `.gitignore`.

---

## Local Build

```bash
npm install
npm run build       # → dist/
npm run preview     # Preview production build on http://localhost:4173
```

---

## Deploy to Netlify (auto)

Push to `main` branch — Netlify picks it up automatically.

```bash
git push origin main
```

Build settings (already in `netlify.toml`):
- **Build command:** `npm run build`
- **Publish directory:** `dist`

---

## Deploy to Netlify (manual CLI)

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Database Migrations

Migrations are in `supabase/migrations/` (45 SQL files, chronological order).

Apply to a new Supabase project via the SQL Editor (paste each file in order), or via Supabase CLI:

```bash
supabase db push --project-ref your-project-ref
```

---

## Supabase Auth Configuration

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL:** `https://cleanquarter.netlify.app`
- **Additional Redirect URLs:**
  - `https://cleanquarter.netlify.app/**`
  - `http://localhost:5173/**`

---

## Post-Deployment Verification

1. Site loads: https://cleanquarter.netlify.app
2. Login works (Supabase Auth)
3. Dashboard loads campaigns and map
4. Create campaign works (with date/time)
5. Language switcher works (BG ↔ EN)
6. Notification bell appears for logged-in users
7. Admin panel accessible (if admin user)

---

## Rollback

```bash
# Netlify Dashboard → Deploys → select previous deploy → "Publish deploy"
# Or via CLI:
netlify rollback
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails "Module not found" | `rm -rf node_modules && npm install` |
| Login doesn't work in production | Add Netlify URL to Supabase Auth redirect URLs |
| 404 on page refresh | Already handled by `netlify.toml` redirects — verify file is committed |
| Env vars not replaced | Names must be `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` exactly |
