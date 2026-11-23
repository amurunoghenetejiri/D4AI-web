import { createFileRoute, redirect } from "@tanstack/react-router";

/** No login on standalone D4AI — always open the app. */
export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/" as never });
  },
  component: () => null,
});
