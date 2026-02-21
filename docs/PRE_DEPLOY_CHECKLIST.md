# ✅ Pre-Deployment Checklist - Clean Quarter

**Site:** https://cleanquarter.netlify.app
**Date:** 2026-02-14

## 🔐 Netlify Environment Variables

Go to: **Netlify Dashboard → Site settings → Environment variables**

- [ ] `VITE_SUPABASE_URL` = `https://hulwbevuvbepnjpikjht.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `sb_publishable_Hh_84smvpfvwTgUEH2qzTg_omdAe4tP`

**⚠️ Verify:**
- [ ] Variable names start with `VITE_` (not just `SUPABASE_`)
- [ ] No extra spaces before/after values
- [ ] Variables are set for "All scopes" (Production, Deploy Previews, Branch deploys)

---

## 🔒 Supabase Authentication URLs

Go to: **Supabase Dashboard → Authentication → URL Configuration**

**Site URL:**
- [ ] `https://cleanquarter.netlify.app`

**Additional Redirect URLs:**
- [ ] `https://cleanquarter.netlify.app/**`
- [ ] `https://cleanquarter.netlify.app/index.html`
- [ ] `http://localhost:5173/**` (за local development)

**⚠️ Verify:**
- [ ] All URLs use HTTPS (not HTTP) for production
- [ ] No trailing slash on base URL: `cleanquarter.netlify.app` ✅ not `cleanquarter.netlify.app/`

---

## 📦 Build Configuration

Go to: **Netlify Dashboard → Site settings → Build & deploy**

**Build settings:**
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Node version: 18.x or higher (check in Netlify logs)

**⚠️ Verify:**
- [ ] `netlify.toml` file exists in repository root
- [ ] Repository is connected to GitHub/GitLab

---

## 🧪 Local Verification (Before Push)

Run these commands locally:

```bash
# 1. Build succeeds
npm run build
# Expected: ✓ built in ~2s

# 2. Preview works
npm run preview
# Expected: Server runs on http://localhost:4173

# 3. Check dist/ folder exists
ls -la dist/
# Expected: Contains index.html, src/, assets/

# 4. Verify environment variables are replaced
grep "import.meta.env.VITE_SUPABASE" dist/assets/*.js
# Expected: No matches (Vite replaced them)
```

---

## 🚀 Deployment Steps

### Step 1: Commit & Push
```bash
git status
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

### Step 2: Monitor Netlify Deploy
1. Go to: **Netlify Dashboard → Deploys**
2. Watch the build log in real-time
3. Look for errors (should see "✓ built in ~2s")

### Step 3: Verify Deployment
After deploy succeeds:

**Basic Checks:**
- [ ] Site loads: https://cleanquarter.netlify.app
- [ ] No errors in Browser Console (F12)
- [ ] See: `✅ i18n initialized with ["bg", "en"] languages`

**Functionality Checks:**
- [ ] Login works (Supabase Auth)
- [ ] Dashboard loads campaigns
- [ ] Create campaign works
- [ ] Admin panel accessible (if admin user)
- [ ] Map displays correctly (Leaflet.js)
- [ ] Language switcher works (БГ ↔️ EN)

---

## 🔍 Common Issues & Solutions

### Issue: Build fails with "Module not found"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update dependencies"
git push
```

### Issue: Build fails with "Supabase configuration missing"
**Solution:**
- Verify environment variables in Netlify Dashboard
- Names must be EXACTLY: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Clear cache and redeploy: **Netlify Dashboard → Deploys → Trigger deploy → Clear cache and deploy site**

### Issue: Login doesn't work in production
**Solution:**
- Add Netlify URL to Supabase Auth allowed domains (see above)
- Check Browser Console for CORS errors
- Verify Supabase URL in environment variables matches your project

### Issue: 404 on page refresh
**Solution:**
- Already handled by `netlify.toml` redirects
- If still happening, verify `netlify.toml` is in repository root

---

## 📊 Expected Build Output

You should see something like:
```
✓ 77 modules transformed
✓ built in 2.17s

dist/index.html                   55.08 kB
dist/assets/supabase-yBXCsoMy.js  176.54 kB │ gzip: 47.09 kB
dist/assets/admin-XaZgpSYL.js     22.20 kB  │ gzip: 5.48 kB
...
```

**Total dist/ size:** ~693 KB

---

## ✅ Final Pre-Deploy Checklist

Before you push to GitHub and trigger Netlify deploy:

- [ ] Local build succeeds (`npm run build`)
- [ ] Local preview works (`npm run preview`)
- [ ] Netlify environment variables set correctly
- [ ] Supabase redirect URLs configured
- [ ] `netlify.toml` committed to repo
- [ ] All changes committed and pushed to `main` branch

**If all checkboxes are ✅, you're ready to deploy!** 🚀

---

## 📞 Support

If deployment fails:
1. Check Netlify deploy logs for specific error
2. Verify environment variables (most common issue)
3. Test build locally: `npm run build`
4. Check Supabase dashboard for Auth configuration

**Netlify Build Minutes:** Free tier includes 300 build minutes/month
**Each build takes:** ~2 seconds
**Deploys per month (estimate):** 100-200 (plenty of room!)
