import { createFileRoute } from "@tanstack/react-router";
import { enhanceImagePrompt, pickImageModel, pollinationsImageUrl } from "@/lib/pollinations";

/**
 * POST /api/d4ai/image
 * Body: { prompt: string, width?: number, height?: number, model?: string }
 * Returns: { url, model, prompt }
 */
export const Route = createFileRoute("/api/d4ai/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            prompt?: string;
            width?: number;
            height?: number;
            model?: "flux" | "flux-realism" | "turbo" | "gptimage";
          };
          const prompt = String(body.prompt || "").trim();
          if (!prompt) {
            return Response.json({ error: "prompt required" }, { status: 400 });
          }
          const model = body.model || pickImageModel(prompt);
          const enhanced = enhanceImagePrompt(prompt);
          const url = pollinationsImageUrl(enhanced, {
            width: body.width ?? 1024,
            height: body.height ?? 1280,
            model,
            enhance: true,
          });
          // Warm / validate Pollinations returns an image
          const head = await fetch(url, { method: "HEAD" }).catch(() => null);
          const ok = head?.ok || head?.status === 200;
          return Response.json({
            url,
            model,
            prompt: enhanced,
            ok: Boolean(ok),
            provider: "pollinations",
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
            provider: "pollinations",
            models: ["flux", "flux-realism"],
            usage: "POST { prompt } or GET ?prompt=",
          });
        }
        const model = pickImageModel(prompt);
        const url = pollinationsImageUrl(prompt, { model, width: 1024, height: 1280 });
        return Response.json({ url, model, provider: "pollinations" });
      },
    },
  },
});
