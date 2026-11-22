# Deploy D4EXAM-D4AI on Vercel

Live URL (your project): **https://d4-exam-d4-ai.vercel.app**

## 1) Connect GitHub repo

1. Open https://vercel.com/data4me/d4-exam-d4-ai (or your project)
2. **Settings → Git**
3. Connect / switch repository to: **amurunoghenetejiri/D4EXAM-D4AI**
4. Production branch: **main**
5. Save

## 2) Environment variables (Production)

Settings → **Environment Variables** → add for **Production** (and Preview if you want):

Copy these from **d4exam-web** (or d4exam-platform) project → Settings → Environment Variables:

| Name | Notes |
|------|--------|
| `VITE_SUPABASE_URL` | Same as d4exam-web |
| `VITE_SUPABASE_ANON_KEY` | Same |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same if used |
| `VITE_SUPABASE_PROJECT_ID` | Same |
| `SUPABASE_URL` | Same |
| `SUPABASE_ANON_KEY` | Same |
| `SUPABASE_PUBLISHABLE_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server only) |
| `SUPABASE_PROJECT_ID` | Same |
| `APP_URL` | `https://d4-exam-d4-ai.vercel.app` |
| `PUBLIC_APP_URL` | `https://d4-exam-d4-ai.vercel.app` |

## 3) Deploy

1. **Deployments** → **Redeploy** latest, or push to `main`
2. Wait until status is **Ready**
3. Open **https://d4-exam-d4-ai.vercel.app** — should open **D4AI only** (no login)

## 4) If build fails

- Framework: leave automatic or Other
- Install: `npm install`
- Build: `npm run build`
- Node: 20.x
