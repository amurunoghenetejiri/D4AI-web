# Copy environment variables to D4EXAM-D4AI on Vercel

I cannot access your Vercel account API from this environment without a Vercel token.

## Fastest path (dashboard)

1. Open **d4exam-web** (or main D4EXAM) on Vercel → **Settings → Environment Variables**
2. Open a second tab: **d4-exam-d4-ai** → **Settings → Environment Variables**
3. For **each** variable in d4exam-web, **Add** the same name + value on d4-exam-d4-ai for **Production**
4. Also set:
   - `APP_URL` = `https://d4-exam-d4-ai.vercel.app`
   - `PUBLIC_APP_URL` = `https://d4-exam-d4-ai.vercel.app`
5. **Deployments → Redeploy** (check "Use existing Build Cache" off)

## Required names (minimum for D4AI chat)

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)
- SUPABASE_URL
- SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY (for any server routes)

## Optional CLI (if you have Vercel CLI logged in)

```bash
# From a machine where `vercel login` works and you own both projects:
vercel link --project d4-exam-d4-ai
# Then pull from web project and push — or set manually in dashboard
```

After redeploy, open: https://d4-exam-d4-ai.vercel.app
