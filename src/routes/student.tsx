import { redirect } from "@tanstack/react-router";
import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * D4EXAM-D4AI product: public D4AI only.
 * No student portal login, no role gate.
 */
export const Route = createFileRoute("/student")({
  ssr: false,
  beforeLoad: ({ location }) => {
    const path = location.pathname || "";
    if (path === "/student/d4ai" || path.startsWith("/student/d4ai/")) return;
    throw redirect({ to: "/student/d4ai" as never });
  },
  component: () => <Outlet />,
});
