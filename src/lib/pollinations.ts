/**
 * Pollinations AI — free image generation (no API key required).
 * Primary model: flux (sharp). Humans → flux-realism.
 * Docs: https://pollinations.ai
 */

export type ImageGenOpts = {
  width?: number;
  height?: number;
  model?: "flux" | "flux-realism" | "turbo" | "gptimage";
  seed?: number;
  enhance?: boolean;
};

const HUMAN_RE =
  /\b(boy|girl|man|woman|person|people|face|portrait|human|child|kid|baby|lady|gentleman|model|selfie)\b/i;

/** Pick best free Pollinations model for the prompt. */
export function pickImageModel(prompt: string): "flux" | "flux-realism" {
  return HUMAN_RE.test(prompt) ? "flux-realism" : "flux";
}

/** Enhance prompt for sharper, cleaner output (no watermark). */
export function enhanceImagePrompt(prompt: string): string {
  const base = prompt.trim().replace(/\s+/g, " ").slice(0, 380);
  if (!base) return "cinematic scene, ultra detailed, 8k";
  if (/ultra realistic|8k|masterpiece|dslr/i.test(base)) return base;
  return `${base}, ultra realistic photo, 8k resolution, sharp focus, highly detailed, cinematic lighting, professional photography, natural colors, masterpiece`;
}

/** Build a direct Pollinations image URL. */
export function pollinationsImageUrl(prompt: string, opts: ImageGenOpts = {}): string {
  const width = opts.width ?? 1024;
  const height = opts.height ?? 1280;
  const model = opts.model ?? pickImageModel(prompt);
  const enhance = opts.enhance !== false;
  const seed = opts.seed ?? Math.floor(Math.random() * 1_000_000);
  const text = enhance ? enhanceImagePrompt(prompt) : prompt.trim().slice(0, 400);
  const encoded = encodeURIComponent(text || "beautiful scene");
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model,
    nologo: "true",
    enhance: "true",
    seed: String(seed),
  });
  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

/** Detect image-generation intent. */
export function isImageGenRequest(text: string): boolean {
  const t = text.toLowerCase().trim();
  return (
    /^(generate|create|draw|paint|make|design)\b.*\b(image|picture|photo|art|illustration|wallpaper|poster)\b/i.test(
      t,
    ) ||
    /^(imagine|draw|paint)\b/i.test(t) ||
    /\b(generate|create)\s+(an?\s+)?(image|picture|photo)\b/i.test(t) ||
    /^\/imagine\b/i.test(t) ||
    /\b(ai\s+image|image\s+of)\b/i.test(t)
  );
}

/** Extract visual prompt from user text. */
export function extractImagePrompt(text: string): string {
  return (
    text
      .replace(/^\/imagine\s*/i, "")
      .replace(
        /^(please\s+)?(generate|create|draw|paint|make|design)\s+(me\s+)?(an?\s+)?(image|picture|photo|art|illustration|wallpaper|poster)?\s*(of\s+)?/i,
        "",
      )
      .trim() || text.trim()
  );
}
