import { useEffect, useState } from "react";

/** Beautiful animated D4AI splash — logo glow, soft particles, elegant fade. */
export function D4AiSplash({ onDone, minMs = 2200 }: { onDone?: () => void; minMs?: number }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("hold"), 400);
    const t2 = window.setTimeout(() => setPhase("out"), minMs - 450);
    const t3 = window.setTimeout(() => onDone?.(), minMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [minMs, onDone]);

  const opacity = phase === "out" ? 0 : 1;
  const scale = phase === "in" ? 0.88 : phase === "out" ? 1.06 : 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, #0c1a3a 0%, #050b18 55%, #02040a 100%)",
        opacity,
        transition: "opacity 0.45s ease-out",
        pointerEvents: phase === "out" ? "none" : "auto",
      }}
      aria-label="D4AI loading"
      aria-busy="true"
    >
      {/* Soft ambient glow rings */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(56,189,248,0.18) 0%, transparent 42%), radial-gradient(circle at 50% 55%, rgba(99,102,241,0.12) 0%, transparent 50%)",
        }}
      />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-cyan-400/40"
            style={{
              width: 3 + (i % 3) * 2,
              height: 3 + (i % 3) * 2,
              left: `${8 + (i * 7.5) % 84}%`,
              top: `${15 + (i * 11) % 70}%`,
              animation: `d4float ${3.2 + (i % 5) * 0.45}s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
              opacity: 0.35 + (i % 4) * 0.1,
            }}
          />
        ))}
      </div>

      <div
        className="relative flex flex-col items-center"
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="relative">
          <div
            className="absolute -inset-6 rounded-full opacity-60 blur-2xl"
            style={{
              background: "radial-gradient(circle, rgba(56,189,248,0.45) 0%, transparent 70%)",
              animation: "d4pulse 2.2s ease-in-out infinite",
            }}
          />
          <img
            src="/d4ai-logo.png"
            alt="D4AI"
            className="relative h-36 w-36 object-contain drop-shadow-[0_0_32px_rgba(56,189,248,0.55)]"
            style={{ animation: "d4breathe 2.4s ease-in-out infinite" }}
          />
        </div>

        <p
          className="mt-7 text-2xl font-semibold tracking-[0.2em] text-transparent bg-clip-text"
          style={{
            backgroundImage: "linear-gradient(90deg, #67e8f9, #a5b4fc, #67e8f9)",
            backgroundSize: "200% 100%",
            animation: "d4shimmer 3s linear infinite",
          }}
        >
          D4AI
        </p>
        <p className="mt-2 text-xs tracking-wide text-slate-400/90">
          Creating Solutions · Innovating Lives
        </p>

        {/* Subtle progress bar */}
        <div className="mt-8 h-[2px] w-28 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400"
            style={{
              width: phase === "out" ? "100%" : "70%",
              transition: `width ${minMs - 200}ms ease-out`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes d4float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.35; }
          50% { transform: translateY(-14px) scale(1.15); opacity: 0.7; }
        }
        @keyframes d4pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.08); }
        }
        @keyframes d4breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes d4shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
