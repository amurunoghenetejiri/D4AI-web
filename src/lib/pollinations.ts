/**
 * Pollinations AI — free image generation (no API key).
 * Uses Flux model for clean, high-quality output.
 * Docs: https://pollinations.ai
 */

export type ImageGenOpts = {
  width?: number;
  height?: number;
  model?: "flux" | "flux-realism" | "turbo" | "gptimage";
  seed?: number;
  enhance?: boolean;
};

/** Build a direct Pollinations image URL (4K-capable). */
export function pollinationsImageUrl(prompt: string, opts: ImageGenOpts = {}): string {
  const width = opts.width ?? 1920;
  const height = opts.height ?? 1080;
  const model = opts.model ?? "flux";
  const enhance = opts.enhance !== false;
  const seed = opts.seed ?? Math.floor(Math.random() * 1_000_000);

  const clean = prompt
    .trim()
    .replace(/^\/?(imagine|draw|generate|create)\s+(an?\s+)?(image|picture|photo|art)?\s*(of\s+)?/i, "")
    .trim()
    .slice(0, 400);

  const encoded = encodeURIComponent(clean || prompt.slice(0, 400));
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model,
    nologo: "true",
    enhance: enhance ? "true" : "false",
    seed: String(seed),
  });

  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

/** Detect if a user message is asking for image generation. */
export function isImageGenRequest(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    /^(generate|create|draw|paint|make|design)\b.*\b(image|picture|photo|art|illustration|wallpaper|poster)\b/i.test(t) ||
    /^(imagine|draw|paint)\b/i.test(t) ||
    /\b(generate|create)\s+(an?\s+)?(image|picture|photo)\b/i.test(t) ||
    /^\/imagine\b/i.test(t)
  );
}

/** Extract the visual prompt from a user message. */
export function extractImagePrompt(text: string): string {
  return text
    .replace(/^\/imagine\s*/i, "")
    .replace(/^(please\s+)?(generate|create|draw|paint|make|design)\s+(me\s+)?(an?\s+)?(image|picture|photo|art|illustration|wallpaper|poster)?\s*(of\s+)?/i, "")
    .trim() || text.trim();
}
