import { createFileRoute, redirect } from "@tanstack/react-router";

/** Public D4AI site — land on chat only. */
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "D4AI" },
      { name: "description", content: "D4AI — your personal AI assistant." },
      { name: "theme-color", content: "#0b1a3a" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/student/d4ai" as never });
  },
  component: () => null,
});
