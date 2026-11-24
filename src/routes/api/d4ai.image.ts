import { createFileRoute } from "@tanstack/react-router";
import { enhanceImagePrompt, pickImageModel, pollinationsImageUrl } from "@/lib/pollinations";

/**
 * POST /api/d4ai/image
 * MAIN: Cloudflare Workers AI FLUX Schnell
 * FALLBACK: Pollinations flux
 *
 * Env (preferred):
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN
 */

const CF_ACCOUNT = (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || "").trim();
const CF_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || "").trim();

const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";

async function cloudflareFlux(prompt: string): Promise<{ url: string; model: string } | null> {
  if (!CF_ACCOUNT || !CF_TOKEN) return null;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/${CF_MODEL}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("CF image fail", res.status, t.slice(0, 200));
    return null;
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("image/")) {
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    const mime = ct.split(";")[0].trim() || "image/png";
    return { url: `data:${mime};base64,${b64}`, model: "flux-1-schnell" };
  }
  const data = (await res.json().catch(() => null)) as {
    result?: { image?: string } | string;
    image?: string;
    success?: boolean;
  } | null;
  if (!data) return null;
  let b64: string | undefined;
  if (typeof data.result === "string") b64 = data.result;
  else if (data.result && typeof data.result === "object" && data.result.image) b64 = data.result.image;
  else if (typeof data.image === "string") b64 = data.image;
  if (!b64) return null;
  // strip data-url prefix if present
  const pure = b64.replace(/^data:image\/\w+;base64,/, "");
  return { url: `data:image/png;base64,${pure}`, model: "flux-1-schnell" };
}

function pollinationsFallback(prompt: string): { url: string; model: string } {
  const model = pickImageModel(prompt);
  const enhanced = enhanceImagePrompt(prompt);
  const url = pollinationsImageUrl(enhanced, {
    width: 1024,
    height: 1024,
    model,
    enhance: true,
  });
  return { url, model };
}

export const Route = createFileRoute("/api/d4ai/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            prompt?: string;
            width?: number;
            height?: number;
          };
          const prompt = String(body.prompt || "").trim();
          if (!prompt) {
            return Response.json({ error: "prompt required" }, { status: 400 });
          }
          const enhanced = enhanceImagePrompt(prompt);

          // 1) Cloudflare first
          try {
            const cf = await cloudflareFlux(enhanced);
            if (cf?.url) {
              return Response.json({
                url: cf.url,
                model: cf.model,
                prompt: enhanced,
                provider: "cloudflare",
                ok: true,
              });
            }
          } catch (e) {
            console.error("CF image exception", e);
          }

          // 2) Pollinations fallback only
          const fb = pollinationsFallback(prompt);
          return Response.json({
            url: fb.url,
            model: fb.model,
            prompt: enhanced,
            provider: "pollinations",
            ok: true,
            fallback: true,
          });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "image gen failed" },
            { status: 500 },
          );
        }
      },
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const prompt = (u.searchParams.get("prompt") || "").trim();
        if (!prompt) {
          return Response.json({
            service: "d4ai-image",
            primary: "cloudflare-flux-1-schnell",
            fallback: "pollinations-flux",
          });
        }
        try {
          const cf = await cloudflareFlux(enhanceImagePrompt(prompt));
          if (cf?.url) return Response.json({ ...cf, provider: "cloudflare" });
        } catch {
          /* */
        }
        const fb = pollinationsFallback(prompt);
        return Response.json({ ...fb, provider: "pollinations", fallback: true });
      },
    },
  },
});
