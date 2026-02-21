# Deployment Guide

## Prerequisites
- Node.js 18+
- Supabase project setup
- Vercel/Netlify account

## Environment Variables
Create `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Build
```bash
npm install
npm run build
```

## Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

## Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Post-Deployment
1. Run database migrations
2. Upload sample data (optional)
3. Test authentication flow
4. Verify storage permissions
5. Monitor error logs

## Rollback
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback
```
