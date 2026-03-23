# Deployment Guide

**Live site:** https://cleanquarter.netlify.app
**Hosting:** Netlify — auto-deploys from `main` branch on GitHub
**Last updated:** 2026-03-22

---

## Quick Reference

| What | Value |
|------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Build time | ~2s |
| Routing rules | `public/_redirects` → copied to `dist/` by Vite |
| Security headers | `public/_headers` → copied to `dist/` by Vite |

> There is no `netlify.toml` in this repo. Build settings are configured directly in the Netlify Dashboard.

---

## 1. Prerequisites

- Node.js 18+
- Supabase project (free tier is sufficient)
- Netlify account connected to the GitHub repository

---

## 2. Environment Variables

Set in **Netlify Dashboard → Site settings → Environment variables**:

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon public` key |

**Rules:**
- Names must start with `VITE_` — Vite replaces them at build time
- No extra spaces before/after values
- Set scope to **All** (Production + Deploy Previews + Branch deploys)
- Never commit `.env.local` — it is in `.gitignore`

---

## 3. Supabase Auth Configuration

In **Supabase Dashboard → Authentication → URL Configuration**:

**Site URL:**
```
https://cleanquarter.netlify.app
```

**Additional Redirect URLs:**
```
https://cleanquarter.netlify.app/**
https://cleanquarter.netlify.app/index.html
http://localhost:5173/**
```

---

## 4. Database Migrations

Migrations are in `supabase/migrations/` (61 SQL files, chronological order).

Apply to a new Supabase project via the SQL Editor (paste each file in order), or via Supabase CLI:

```bash
supabase db push --project-ref your-project-ref
```

> Never edit an applied migration — always create a new one.

---

## 5. Local Verification (Before Push)

Run in order — each must pass before proceeding:

```bash
# 1. Lint — must be 0 warnings
npm run lint

# 2. Tests — all must pass
npm test

# 3. Build
npm run build
# Expected: ✓ built in ~2s

# 4. Preview production build
npm run preview
# Expected: Server on http://localhost:4173

# 5. Verify dist/ is complete
ls dist/_headers dist/_redirects
# Expected: both files exist (copied from public/ by Vite)

# 6. Verify env vars were replaced (no raw VITE_ strings in output)
grep "import.meta.env.VITE_SUPABASE" dist/assets/*.js
# Expected: no matches
```

---

## 6. Deploy Options

### A. Git-based — Auto Deploy (recommended)

Push to `main` — Netlify picks it up automatically:

```bash
git push origin main
```

Monitor progress in **Netlify Dashboard → Deploys**.

### B. Manual CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### C. Manual Drag & Drop

1. Run `npm run build` locally
2. Open **Netlify Dashboard → Deploys**
3. Drag only the **`dist/`** folder into the drop zone

> Upload only `dist/` — not the entire project folder.

---

## 7. Post-Deployment Verification

After deploy completes, verify:

- [ ] Site loads: https://cleanquarter.netlify.app
- [ ] No errors in browser console (F12) — especially no CSP violations
- [ ] Login works (Supabase Auth)
- [ ] Demo mode works (demo login button → dashboard, no credentials)
- [ ] Dashboard loads campaigns and map with clustering
- [ ] Create campaign works (date, time, category, photo upload)
- [ ] Rewards page — browse and redeem flow works
- [ ] Profile page — transactions, participations, avatar tabs
- [ ] Admin panel accessible (if admin user) — check Reports tab
- [ ] Public stats page loads without login: `/src/pages/stats.html`
- [ ] Language switcher works (BG ↔ EN) on all pages
- [ ] Notification bell appears for logged-in users

---

## 8. Rollback

**Via Netlify Dashboard:**
1. Go to **Deploys**
2. Find previous successful deploy
3. Click **"Publish deploy"**

**Via CLI:**
```bash
netlify rollback
```

---

## 9. Common Issues

| Issue | Solution |
|-------|----------|
| Build fails "Module not found" | `rm -rf node_modules && npm install`, commit `package-lock.json`, push |
| Build fails "Supabase configuration missing" | Verify env vars in Netlify Dashboard — names must be exactly `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |
| Login doesn't work in production | Add Netlify URL to Supabase Auth allowed redirect URLs (see §3) |
| 404 on page refresh | Verify `dist/_redirects` exists in build output — it is copied from `public/_redirects` by Vite |
| Env vars not replaced in JS | Names must start with `VITE_`; clear Netlify cache and redeploy |
| Security headers missing | Verify `dist/_headers` exists — copied from `public/_headers` by Vite |

---

## Appendix: Expected Build Output

```
✓ 77+ modules transformed
✓ built in ~2s

dist/index.html                     ~55 kB
dist/assets/supabase-*.js          ~176 kB  │ gzip: ~47 kB
dist/assets/dashboard-*.js          ~45 kB  │ gzip: ~12 kB
dist/assets/admin-*.js              ~35 kB  │ gzip: ~9 kB
dist/_redirects                     (routing rules)
dist/_headers                       (security headers + cache policy)
dist/public/i18n/bg.json
dist/public/i18n/en.json
dist/service-worker.js
dist/manifest.json
```

**Total `dist/` size:** ~700–800 KB uncompressed, ~180 KB gzipped
