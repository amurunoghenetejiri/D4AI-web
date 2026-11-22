import { createFileRoute, redirect } from "@tanstack/react-router";

/** D4EXAM-D4AI: always open D4AI only — no marketing, no login, no other portals. */
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "D4AI — D4EXAM" },
      { name: "description", content: "D4AI study companion" },
      { name: "theme-color", content: "#0b1a3a" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/student/d4ai" as never });
  },
  component: () => null,
});
