// @ts-nocheck
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { title: "D4AI" },
      { name: "description", content: "D4AI — your personal AI assistant" },
      { name: "theme-color", content: "#0b1a3a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: D4AiNotFound,
  errorComponent: D4AiError,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ backgroundColor: "#050b18" }}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh text-white antialiased" style={{ backgroundColor: "#050b18" }}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    try {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.pointerEvents = "";
    } catch {
      /* ignore */
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}

function D4AiNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#050b18] px-6 text-center">
      <img src="/d4ai-logo.png" alt="D4AI" className="h-20 w-20 object-contain" />
      <h1 className="text-lg font-semibold text-cyan-200">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-400">That link isn’t part of D4AI.</p>
      <a
        href="/"
        className="rounded-full bg-cyan-500/90 px-5 py-2.5 text-sm font-semibold text-slate-950"
      >
        Open D4AI
      </a>
    </div>
  );
}

function D4AiError({ error }: { error: Error }) {
  const router = useRouter();
  const msg = String(error?.message || error || "");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#050b18] px-6 text-center">
      <img src="/d4ai-logo.png" alt="D4AI" className="h-20 w-20 object-contain opacity-90" />
      <h1 className="text-lg font-semibold text-cyan-100">D4AI hit a snag</h1>
      <p className="max-w-sm text-sm text-slate-400">
        Something went wrong loading the assistant. You can retry — your chats stay on this device.
      </p>
      {msg ? (
        <p className="max-w-md truncate text-xs text-slate-600" title={msg}>
          {msg.slice(0, 120)}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950"
          onClick={() => {
            try {
              router.invalidate();
            } catch {
              window.location.assign("/");
            }
          }}
        >
          Try again
        </button>
        <button
          type="button"
          className="rounded-full border border-cyan-500/40 px-5 py-2.5 text-sm font-semibold text-cyan-100"
          onClick={() => window.location.assign("/")}
        >
          Reload D4AI
        </button>
      </div>
    </div>
  );
}
