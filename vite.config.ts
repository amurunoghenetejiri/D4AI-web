import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/** D4EXAM-D4AI is deployed only on Vercel — pin Nitro preset. */
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
  },
});
