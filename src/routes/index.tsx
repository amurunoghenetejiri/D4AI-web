import { createFileRoute, redirect } from "@tanstack/react-router";

/** D4EXAM-D4AI: landing is always the D4AI experience (no marketing / no role home). */
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "D4AI — D4EXAM" },
      { name: "description", content: "D4AI study companion on D4EXAM." },
      { name: "theme-color", content: "#0b1a3a" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/student/d4ai" as never });
  },
  component: () => null,
});
