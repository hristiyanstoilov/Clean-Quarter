# 🚀 Netlify Deployment Guide

## Prerequisites
- Supabase project with credentials

## Deployment Options

### Option A — Manual (drag & drop)

1. `npm run build` локално
2. Отвори Netlify → сайта → **Deploys**
3. Влачи само **`dist/`** папката в дропзоната
4. `_redirects` и `_headers` са вградени в `dist/` и се прилагат автоматично

> ⚠️ Качвай само `dist/`, не цялата проектна папка.

### Option B — Git-based (auto deploy)

#### 1. Push to GitHub
```bash
git add .
git commit -m "chore: prepare for Netlify deployment"
git push origin main
```

### 2. Netlify Dashboard Setup

#### A. Build Settings (should auto-detect from netlify.toml)
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18.x or higher

#### B. Environment Variables ⚠️ CRITICAL
Go to: **Site settings → Environment variables**

Add these variables:

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Dashboard → Settings → API → Project API keys → `anon` `public` |

**⚠️ WITHOUT THESE VARIABLES, THE APP WILL FAIL TO BUILD!**

### 3. Deploy
Click **"Deploy site"** in Netlify dashboard.

### 4. Verify Deployment
After deployment completes:
1. Open the Netlify URL (e.g., `https://your-app.netlify.app`)
2. Open Browser Console (F12)
3. Check for errors - should see: `✅ i18n initialized...`
4. Test login functionality
5. Test creating a campaign
6. Test admin panel (if you have admin role)

## Common Issues & Solutions

### ❌ Build fails with "Supabase configuration missing"
**Solution:** Add environment variables in Netlify dashboard (see Step 2B above)

### ❌ "Module not found" errors
**Solution:** Run `npm install` locally, commit `package-lock.json`, push to GitHub

### ❌ 404 errors on page refresh
**Solution:** Already handled by `netlify.toml` redirects

### ❌ Supabase Auth not working
**Solution:** Add your Netlify domain to Supabase allowed domains:
- Supabase Dashboard → Authentication → URL Configuration
- Add your Netlify URL to "Site URL" and "Redirect URLs"

## Rollback to Previous Version
Netlify keeps deployment history:
1. Go to **Deploys** tab
2. Find previous successful deploy
3. Click **"Publish deploy"**

## Useful Commands

### Local production preview
```bash
npm run build
npm run preview
```

### Check build locally
```bash
npm run build
# Check dist/ folder - this is what gets deployed
```

## Environment Variables Checklist
- [ ] `VITE_SUPABASE_URL` added to Netlify
- [ ] `VITE_SUPABASE_ANON_KEY` added to Netlify
- [ ] Netlify domain added to Supabase Auth settings
- [ ] Test build locally with `npm run build`
- [ ] Verify `.env.local` is in `.gitignore` (don't commit secrets!)

## Support
If deployment fails:
1. Check Netlify deploy logs for error messages
2. Verify environment variables are set correctly
3. Test build locally: `npm run build`
