# D4EXAM-D4AI

Standalone **D4AI** app (from D4EXAM). Home opens only the D4AI page.

## Live

After Vercel is connected: **https://d4-exam-d4-ai.vercel.app**

## Deploy

See [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) — connect GitHub repo `D4EXAM-D4AI`, copy Supabase env from `d4exam-web`, redeploy.

## Local

```bash
npm install
npm run dev
```

# D4EXAM-D4AI

Standalone **D4AI** experience extracted from D4EXAM.

- Single main UI: `/student/d4ai` (home `/` redirects here)
- Same React / TanStack / Supabase / Vercel stack as d4exam-web
- No multi-role dashboards required to use D4AI

## Dev

```bash
bun install
bun run dev
```

## Deploy

Connect this repo to Vercel. Suggested production domain: `d4exam-d4ai.vercel.app`
