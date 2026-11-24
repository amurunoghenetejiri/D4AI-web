/**
 * Streaming D4AI chat
 * MAIN: Cloudflare @cf/meta/llama-3.3-70b-instruct-fp8-fast
 * FALLBACK: Pollinations / Ollama (existing)
 * Env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
 */
import { createFileRoute } from "@tanstack/react-router";

const CF_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

function cfAccount() {
  return (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || "").trim();
}
function cfToken() {
  return (process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || "").trim();
}

function ollamaBase() {
  return (process.env.D4AI_BASE_URL || "http://147.224.179.220:11434").replace(/\/$/, "");
}
function textModel() {
  return process.env.D4AI_MODEL || "d4ai";
}

type Msg = { role: string; content: string };

const SYSTEM =
  "You are D4AI by D4TECH — a friendly, helpful study and life companion. " +
  "Reply clearly with short paragraphs or bullets. Match the user's language (including Nigerian Pidgin when they use it). " +
  "Never start with 'Error', 'fetch failed', or raw system messages. " +
  "Vary your openings naturally. For greetings, be warm and brief. " +
  "If the user told you their name or personal facts, remember and use them. " +
  "Never say [Name] as a placeholder — use the real name from memory. " +
  "For math: first state the final answer, then clear step-by-step solution. " +
  "Be detailed when helpful, but not bloated.";

async function cloudflareChat(messages: Msg[]): Promise<string | null> {
  const account = cfAccount();
  const token = cfToken();
  if (!account || !token) return null;
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${CF_MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "system", content: SYSTEM }, ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 12000),
      }))],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("CF text fail", res.status, t.slice(0, 180));
    return null;
  }
  const data = (await res.json()) as {
    result?: { response?: string } | string;
    success?: boolean;
  };
  if (typeof data.result === "string") return data.result;
  if (data.result && typeof data.result === "object" && data.result.response) {
    return String(data.result.response);
  }
  return null;
}

async function pollinationsFallback(messages: Msg[]): Promise<string | null> {
  try {
    const last = messages.filter((m) => m.role === "user").pop()?.content || "";
    const prompt = messages
      .slice(-8)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    const url =
      "https://text.pollinations.ai/" +
      encodeURIComponent(
        `${SYSTEM}\n\nConversation:\n${prompt}\n\nassistant:`,
      );
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/plain" },
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text || null;
  } catch {
    return null;
  }
}

async function ollamaFallback(messages: Msg[]): Promise<Response | null> {
  try {
    const res = await fetch(`${ollamaBase()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: textModel(),
        messages: [{ role: "system", content: SYSTEM }, ...messages],
        stream: true,
        options: { num_predict: 1024, temperature: 0.5 },
      }),
    });
    if (!res.ok || !res.body) return null;
    return res;
  } catch {
    return null;
  }
}

function sseEncode(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export const Route = createFileRoute("/api/d4ai/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            messages?: Msg[];
            images?: string[];
            documentText?: string;
            documentName?: string;
          };
          let messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
          if (!messages.length) {
            return Response.json({ error: "No messages" }, { status: 400 });
          }
          // Attach document text to last user message if present
          if (body.documentText?.trim()) {
            const last = messages[messages.length - 1];
            if (last?.role === "user") {
              last.content +=
                `\n\n---\nContent from "${body.documentName || "document"}":\n` +
                String(body.documentText).slice(0, 12000);
            }
          }

          // 1) Cloudflare text (non-stream JSON → pseudo-stream tokens)
          try {
            const answer = await cloudflareChat(messages);
            if (answer && answer.trim()) {
              const encoder = new TextEncoder();
              const stream = new ReadableStream({
                start(controller) {
                  // stream in small chunks so UI types smoothly
                  const words = answer.split(/(\s+)/);
                  let i = 0;
                  const push = () => {
                    if (i >= words.length) {
                      controller.enqueue(
                        encoder.encode(sseEncode({ done: true, provider: "cloudflare" })),
                      );
                      controller.close();
                      return;
                    }
                    const chunk = words.slice(i, i + 3).join("");
                    i += 3;
                    controller.enqueue(
                      encoder.encode(
                        sseEncode({ token: chunk, provider: "cloudflare" }),
                      ),
                    );
                    setTimeout(push, 12);
                  };
                  push();
                },
              });
              return new Response(stream, {
                headers: {
                  "Content-Type": "text/event-stream",
                  "Cache-Control": "no-cache",
                  "X-D4AI-Provider": "cloudflare",
                },
              });
            }
          } catch (e) {
            console.error("CF text exception", e);
          }

          // 2) Pollinations fallback
          try {
            const fb = await pollinationsFallback(messages);
            if (fb && fb.trim()) {
              const encoder = new TextEncoder();
              const stream = new ReadableStream({
                start(controller) {
                  controller.enqueue(
                    encoder.encode(
                      sseEncode({ token: fb, provider: "fallback", done: false }),
                    ),
                  );
                  controller.enqueue(
                    encoder.encode(sseEncode({ done: true, provider: "fallback" })),
                  );
                  controller.close();
                },
              });
              return new Response(stream, {
                headers: {
                  "Content-Type": "text/event-stream",
                  "X-D4AI-Provider": "fallback",
                },
              });
            }
          } catch {
            /* */
          }

          // 3) Ollama stream if available
          const ollama = await ollamaFallback(messages);
          if (ollama?.body) {
            return new Response(ollama.body, {
              headers: {
                "Content-Type": "text/event-stream",
                "X-D4AI-Provider": "ollama",
              },
            });
          }

          return Response.json(
            { error: "All text providers unavailable. Try again." },
            { status: 503 },
          );
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "stream failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
