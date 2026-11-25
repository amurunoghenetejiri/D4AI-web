# Vercel Environment Variables (2 Cloudflare accounts)

## Already exists (Account 1) — Image + TTS
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN

Do NOT create these again. Edit the existing ones if needed.

## NEW names (Account 2) — Text / chat brain
Add these as **new** variables (different names so Vercel accepts them):

| Key | Purpose |
|-----|---------|
| `CLOUDFLARE_TEXT_ACCOUNT_ID` | Second Cloudflare account ID (text model) |
| `CLOUDFLARE_TEXT_API_TOKEN` | Second Cloudflare API token (text model) |

After adding, Redeploy Production.

Code order:
- Text → CLOUDFLARE_TEXT_* first, then falls back to CLOUDFLARE_*
- Image / TTS → CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN
