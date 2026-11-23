import { useEffect, useState } from "react";

/** Animated D4AI splash — logo pulse, transparent-friendly dark base. */
export function D4AiSplash({ onDone, minMs = 1600 }: { onDone?: () => void; minMs?: number }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setHide(true);
      onDone?.();
    }, minMs);
    return () => window.clearTimeout(t);
  }, [minMs, onDone]);
  if (hide) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{ backgroundColor: "#000" }}
      aria-label="D4AI loading"
    >
      <img
        src="/d4ai-logo.png"
        alt="D4AI"
        className="h-36 w-36 animate-pulse object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.55)]"
        style={{ animationDuration: "1.4s" }}
      />
      <p className="mt-6 text-lg font-semibold tracking-wide text-cyan-300">D4AI</p>
      <p className="mt-1 text-xs text-slate-400">Creating Solutions · Innovating Lives</p>
    </div>
  );
}
