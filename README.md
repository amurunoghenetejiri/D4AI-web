# D4AI

Standalone personal AI assistant (web + Android).

- **Web:** D4AI chat only — no school login portal
- **Android package:** `com.d4ai`
- **Logo / favicon:** D4AI robot mark

## Dev
```bash
npm install
npm run dev
```

## Deploy
Vercel project linked to this repo. Env: Supabase keys (same as D4EXAM if you share a project) optional for pure chat via `/api/d4ai/*`.

## Routes kept
- `/` → redirects to `/student/d4ai`
- `/login` → redirects to `/student/d4ai`
- `/student/d4ai` — main app
- `/api/d4ai/*` — chat, stream, tts, voice, live
