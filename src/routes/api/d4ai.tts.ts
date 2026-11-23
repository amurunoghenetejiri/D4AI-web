/**
 * Free TTS proxy — distinct neural voices per character.
 * GET /api/d4ai/tts?voice=ada&text=Hello
 * Priority: StreamElements named voices → Edge Neural → Google Translate TTS
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

/** Each D4AI character → unique Edge Neural voice + Google lang accent */
const VOICE_CFG: Record<string, { tl: string; edge: string; se: string }> = {
  // Current 10 voices — all different neural speakers
  ada: { tl: "en-GB", edge: "en-GB-SoniaNeural", se: "Amy" },
  chidi: { tl: "en-US", edge: "en-US-GuyNeural", se: "Brian" },
  tunde: { tl: "en-GB", edge: "en-US-EricNeural", se: "Matthew" },
  amaka: { tl: "en-AU", edge: "en-US-JennyNeural", se: "Joanna" },
  ngozi: { tl: "en-GB", edge: "en-GB-LibbyNeural", se: "Emma" },
  kola: { tl: "en-US", edge: "en-US-ChristopherNeural", se: "Matthew" },
  funke: { tl: "en", edge: "en-US-AnaNeural", se: "Ivy" },
  robo: { tl: "en-US", edge: "en-US-DavisNeural", se: "Justin" },
  nova: { tl: "en-AU", edge: "en-AU-NatashaNeural", se: "Salli" },
  baritone: { tl: "en-GB", edge: "en-GB-ThomasNeural", se: "Brian" },

  // Legacy / aliases
  ceo: { tl: "en-NG", edge: "en-US-ChristopherNeural", se: "Brian" },
  lovelle: { tl: "en-AU", edge: "en-US-JennyNeural", se: "Joanna" },
  chippy: { tl: "en-IN", edge: "en-US-AnaNeural", se: "Ivy" },
  whisper: { tl: "en-GB", edge: "en-GB-SoniaNeural", se: "Emma" },
  bella: { tl: "en", edge: "en-US-AriaNeural", se: "Joanna" },
  bubbly: { tl: "en-ZA", edge: "en-US-AnaNeural", se: "Ivy" },
  cosmo: { tl: "en-IE", edge: "en-GB-RyanNeural", se: "Joey" },
  titan: { tl: "en-GB", edge: "en-US-EricNeural", se: "Matthew" },
  orion: { tl: "en-US", edge: "en-US-SteffanNeural", se: "Matthew" },
  astro: { tl: "en", edge: "en-US-GuyNeural", se: "Joey" },
  rex: { tl: "en-US", edge: "en-US-ChristopherNeural", se: "Brian" },
  atlas: { tl: "en-GB", edge: "en-GB-RyanNeural", se: "Matthew" },
  luna: { tl: "en-AU", edge: "en-AU-NatashaNeural", se: "Emma" },
  aria: { tl: "en-AU", edge: "en-US-AriaNeural", se: "Joanna" },
  // StreamElements / Amazon-style names
  Brian: { tl: "en-US", edge: "en-US-GuyNeural", se: "Brian" },
  Amy: { tl: "en-GB", edge: "en-GB-SoniaNeural", se: "Amy" },
  Emma: { tl: "en-AU", edge: "en-AU-NatashaNeural", se: "Emma" },
  Matthew: { tl: "en-GB", edge: "en-US-EricNeural", se: "Matthew" },
  Joey: { tl: "en", edge: "en-US-GuyNeural", se: "Joey" },
  Justin: { tl: "en-US", edge: "en-US-DavisNeural", se: "Justin" },
  Joanna: { tl: "en-GB", edge: "en-US-JennyNeural", se: "Joanna" },
  Salli: { tl: "en-AU", edge: "en-US-MichelleNeural", se: "Salli" },
  Ivy: { tl: "en", edge: "en-US-AnaNeural", se: "Ivy" },
};

function resolve(raw: string) {
  const v = (raw || "").trim();
  if (VOICE_CFG[v]) return VOICE_CFG[v];
  const lower = v.toLowerCase();
  if (VOICE_CFG[lower]) return VOICE_CFG[lower];
  if (v.includes("Neural")) return { tl: "en-US", edge: v, se: "Brian" };
  return { tl: "en-US", edge: "en-US-GuyNeural", se: "Brian" };
}

async function seSpeak(text: string, voice: string): Promise<ArrayBuffer | null> {
  const q = encodeURIComponent(text.slice(0, 280));
  const v = encodeURIComponent(voice);
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${v}&text=${q}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 D4AI/1.0",
        Accept: "audio/mpeg,audio/*,*/*",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 200 ? buf : null;
  } catch {
    return null;
  }
}

function secMsGec(): string {
  const ticks = BigInt(Date.now()) * 10000n + 621355968000000000n;
  const rounded = ticks - (ticks % 3000000000n);
  const str = `${rounded}${TRUSTED_CLIENT_TOKEN}`;
  return createHash("sha256").update(str, "ascii").digest("hex").toUpperCase();
}

async function edgeSpeak(text: string, edgeVoice: string): Promise<ArrayBuffer | null> {
  try {
    const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${edgeVoice}'>${escapeXml(text.slice(0, 500))}</voice></speak>`;
    const res = await fetch(
      `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec()}&Sec-MS-GEC-Version=1-130.0.2849.68`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
        },
        body: ssml,
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 200 ? buf : null;
  } catch {
    return null;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function googleSpeak(text: string, tl: string): Promise<ArrayBuffer | null> {
  try {
    const q = encodeURIComponent(text.slice(0, 180));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=${encodeURIComponent(tl)}&client=tw-ob`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 D4AI/1.0", Accept: "audio/mpeg" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 200 ? buf : null;
  } catch {
    return null;
  }
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/d4ai/tts")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const text = (url.searchParams.get("text") || "").trim();
        const voice = (url.searchParams.get("voice") || "ada").trim();
        if (!text) {
          return Response.json({ error: "text required" }, { status: 400, headers: cors });
        }
        const cfg = resolve(voice);

        // 1) StreamElements — truly different named voices
        const se = await seSpeak(text, cfg.se);
        if (se) {
          return new Response(se, {
            status: 200,
            headers: {
              ...cors,
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=3600",
              "X-D4AI-Voice": `${voice}->se:${cfg.se}`,
            },
          });
        }

        // 2) Edge Neural — different speaker per character
        const edge = await edgeSpeak(text, cfg.edge);
        if (edge) {
          return new Response(edge, {
            status: 200,
            headers: {
              ...cors,
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=3600",
              "X-D4AI-Voice": `${voice}->edge:${cfg.edge}`,
            },
          });
        }

        // 3) Google Translate TTS — different accents via tl
        const g = await googleSpeak(text, cfg.tl);
        if (g) {
          return new Response(g, {
            status: 200,
            headers: {
              ...cors,
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=3600",
              "X-D4AI-Voice": `${voice}->google:${cfg.tl}`,
            },
          });
        }

        return Response.json({ error: "tts unavailable" }, { status: 502, headers: cors });
      },
    },
  },
});
