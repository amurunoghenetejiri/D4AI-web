import { useEffect, useState } from "react";

/**
 * D4AI splash — matches product art:
 * neon robot logo, concentric cyan rings, D4AI / D4TECH / motto, thin progress bar.
 */
export function D4AiSplash({
  minMs = 2200,
  onDone,
}: {
  minMs?: number;
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const tIn = window.setTimeout(() => setPhase("hold"), 120);
    const tProg = window.setInterval(() => {
      setProgress((p) => (p >= 96 ? 96 : p + 3 + Math.random() * 4));
    }, 80);
    const tOut = window.setTimeout(() => {
      setProgress(100);
      setPhase("out");
    }, Math.max(1400, minMs - 400));
    const tDone = window.setTimeout(() => onDone?.(), Math.max(1800, minMs));
    return () => {
      window.clearTimeout(tIn);
      window.clearTimeout(tOut);
      window.clearTimeout(tDone);
      window.clearInterval(tProg);
    };
  }, [minMs, onDone]);

  const opacity = phase === "out" ? 0 : 1;
  const scale = phase === "in" ? 0.92 : phase === "out" ? 1.04 : 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 42%, #0c1a3a 0%, #070f22 45%, #03060f 100%)",
        opacity,
        transition: "opacity 0.5s ease-out",
        pointerEvents: phase === "out" ? "none" : "auto",
      }}
      aria-label="D4AI loading"
      aria-busy="true"
    >
      {/* Soft ambient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.14) 0%, transparent 38%)",
        }}
      />

      <div
        className="relative flex flex-col items-center"
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Concentric glow rings + logo (matches screenshot) */}
        <div className="relative grid h-[168px] w-[168px] place-items-center">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: "1.5px solid rgba(34,211,238,0.22)",
              animation: "d4ring 2.6s ease-in-out infinite",
              boxShadow: "0 0 40px rgba(34,211,238,0.15)",
            }}
          />
          <span
            className="absolute inset-[18px] rounded-full"
            style={{
              border: "1.2px solid rgba(34,211,238,0.35)",
              animation: "d4ring 2s ease-in-out infinite reverse",
            }}
          />
          <span
            className="absolute inset-[36px] rounded-full"
            style={{
              border: "1px solid rgba(129,140,248,0.25)",
              animation: "d4pulse 2.2s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-[28px] rounded-full opacity-70 blur-xl"
            style={{
              background: "radial-gradient(circle, rgba(34,211,238,0.45) 0%, transparent 70%)",
              animation: "d4pulse 2.2s ease-in-out infinite",
            }}
          />
          <img
            src="/d4ai-logo.png"
            alt="D4AI"
            className="relative z-10 h-[108px] w-[108px] object-contain"
            style={{
              animation: "d4breathe 2.4s ease-in-out infinite",
              filter: "drop-shadow(0 0 28px rgba(34,211,238,0.55))",
            }}
          />
        </div>

        <p
          className="mt-8 text-[1.65rem] font-semibold tracking-[0.28em] text-white"
          style={{ textShadow: "0 0 24px rgba(34,211,238,0.35)" }}
        >
          D4AI
        </p>
        <p className="mt-2 text-[0.7rem] font-medium tracking-[0.42em] text-slate-400/90">
          D 4 T E C H
        </p>
        <p className="mt-2 text-[0.78rem] tracking-wide text-slate-400/85">
          Creating Solutions. Innovating Lives.
        </p>

        {/* Thin progress bar — cyan fill */}
        <div className="mt-9 h-[2.5px] w-[112px] overflow-hidden rounded-full bg-[#1e3a5f]/90">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, progress)}%`,
              background: "linear-gradient(90deg, #22d3ee, #6366f1)",
              transition: "width 90ms linear",
              boxShadow: "0 0 10px rgba(34,211,238,0.55)",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes d4breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.045); }
        }
        @keyframes d4pulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.04); }
        }
        @keyframes d4ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
