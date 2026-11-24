/**
 * D4AI TTS — Cloudflare Deepgram Aura-2
 * Env: CF_TTS_ACCOUNT_ID + CF_TTS_TOKEN (or CLOUDFLARE_* fallback)
 * Body: { text, voice?: "luna"|... }
 */
import { createFileRoute } from "@tanstack/react-router";

const MODEL = "@cf/deepgram/aura-2-en";

const VOICES = [
  "luna", "orion", "asteria", "thalia", "andromeda",
  "atlas", "helios", "callista", "draco", "lyra",
] as const;

function account() {
  return (
    process.env.CF_TTS_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID ||
    ""
  ).trim();
}
function token() {
  return (
    process.env.CF_TTS_TOKEN ||
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    ""
  ).trim();
}

export const Route = createFileRoute("/api/d4ai/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            text?: string;
            voice?: string;
          };
          const text = String(body.text || "").trim().slice(0, 4000);
          if (!text) return Response.json({ error: "text required" }, { status: 400 });
          let voice = String(body.voice || "luna").toLowerCase();
          if (!(VOICES as readonly string[]).includes(voice)) voice = "luna";

          const acc = account();
          const tok = token();
          if (!acc || !tok) {
            return Response.json({ error: "tts_unconfigured", offline: true }, { status: 503 });
          }

          const url = `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/${MODEL}`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tok}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, speaker: voice }),
          });
          if (!res.ok) {
            const err = await res.text().catch(() => "");
            return Response.json(
              { error: "tts_failed", detail: err.slice(0, 200), offline: true },
              { status: 502 },
            );
          }
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("audio") || ct.includes("octet-stream")) {
            const buf = await res.arrayBuffer();
            return new Response(buf, {
              headers: {
                "Content-Type": ct.includes("audio") ? ct : "audio/mpeg",
                "Cache-Control": "no-store",
              },
            });
          }
          const data = (await res.json().catch(() => null)) as {
            result?: { audio?: string } | string;
          } | null;
          let b64: string | undefined;
          if (typeof data?.result === "string") b64 = data.result;
          else if (data?.result && typeof data.result === "object") b64 = data.result.audio;
          if (!b64) {
            return Response.json({ error: "no_audio", offline: true }, { status: 502 });
          }
          const pure = b64.replace(/^data:audio\/\w+;base64,/, "");
          const bytes = Buffer.from(pure, "base64");
          return new Response(bytes, {
            headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
          });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "tts error", offline: true },
            { status: 500 },
          );
        }
      },
      GET: async () =>
        Response.json({
          service: "d4ai-tts",
          model: MODEL,
          voices: VOICES,
          default: "luna",
        }),
    },
  },
});
