/**
 * D4AI STT — Cloudflare OpenAI Whisper
 * Env: CF_STT_ACCOUNT_ID + CF_STT_TOKEN (or CLOUDFLARE_* fallback)
 * Body: multipart audio OR { audio: base64 }
 */
import { createFileRoute } from "@tanstack/react-router";

const MODEL = "@cf/openai/whisper";

function account() {
  return (
    process.env.CF_STT_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.CF_ACCOUNT_ID ||
    ""
  ).trim();
}
function token() {
  return (
    process.env.CF_STT_TOKEN ||
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    ""
  ).trim();
}

export const Route = createFileRoute("/api/d4ai/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const acc = account();
          const tok = token();
          if (!acc || !tok) {
            return Response.json({ error: "stt_unconfigured", offline: true }, { status: 503 });
          }

          let audioBytes: ArrayBuffer | null = null;
          const ct = request.headers.get("content-type") || "";
          if (ct.includes("multipart/form-data")) {
            const form = await request.formData();
            const file = form.get("audio") || form.get("file");
            if (file && typeof file !== "string") {
              audioBytes = await (file as Blob).arrayBuffer();
            }
          } else {
            const body = (await request.json().catch(() => ({}))) as { audio?: string };
            if (body.audio) {
              const pure = body.audio.replace(/^data:audio\/\w+;base64,/, "");
              audioBytes = Buffer.from(pure, "base64").buffer;
            }
          }
          if (!audioBytes) {
            return Response.json({ error: "audio required" }, { status: 400 });
          }

          const url = `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/${MODEL}`;
          // Workers AI whisper accepts raw body or JSON with audio array
          const u8 = new Uint8Array(audioBytes);
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tok}`,
              "Content-Type": "application/octet-stream",
            },
            body: u8,
          });
          if (!res.ok) {
            // try JSON base64 form
            const b64 = Buffer.from(u8).toString("base64");
            const res2 = await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${tok}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ audio: [...u8] }),
            });
            if (!res2.ok) {
              const err = await res2.text().catch(() => "");
              return Response.json(
                { error: "stt_failed", detail: err.slice(0, 200), offline: true },
                { status: 502 },
              );
            }
            const data2 = (await res2.json()) as { result?: { text?: string } | string };
            const text2 =
              typeof data2.result === "string"
                ? data2.result
                : data2.result?.text || "";
            return Response.json({ text: text2, provider: "cloudflare-whisper" });
          }
          const data = (await res.json()) as { result?: { text?: string } | string };
          const text =
            typeof data.result === "string" ? data.result : data.result?.text || "";
          return Response.json({ text, provider: "cloudflare-whisper" });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "stt error", offline: true },
            { status: 500 },
          );
        }
      },
      GET: async () =>
        Response.json({ service: "d4ai-stt", model: MODEL }),
    },
  },
});
