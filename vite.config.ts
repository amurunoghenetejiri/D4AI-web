import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * On Vercel, Nitro must use the vercel preset so the deployment
 * produces serverless functions instead of a static "dist" folder.
 */
const onVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: onVercel
    ? {
        preset: "vercel",
      }
    : undefined,
});
