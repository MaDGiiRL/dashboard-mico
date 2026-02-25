import React from "react";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function OlympicLoader({ label = "Caricamento…" }) {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 text-neutral-900">
      {/* premium background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/75 via-white/60 to-white/90" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(50%_50%_at_90%_10%,rgba(236,72,153,0.16),transparent_55%),radial-gradient(50%_50%_at_10%_90%,rgba(34,197,94,0.14),transparent_55%)]" />
      <div className="absolute inset-0 -z-10 backdrop-blur-[2px]" />

      <div className="w-full max-w-md rounded-3xl overflow-hidden bg-white/55 backdrop-blur-md shadow-[0_18px_50px_rgba(0,0,0,0.10)] ring-1 ring-white/45">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />

        <div className="p-7">
          <div className="flex items-center justify-center">
            {/* RINGS */}
            <div className="relative h-24 w-44">
              {/* top row */}
              <Ring className="absolute left-0 top-0" tone="indigo" delay="0ms" />
              <Ring className="absolute left-16 top-0" tone="neutral" delay="120ms" />
              <Ring className="absolute left-32 top-0" tone="rose" delay="240ms" />
              {/* bottom row */}
              <Ring className="absolute left-8 top-10" tone="emerald" delay="360ms" />
              <Ring className="absolute left-24 top-10" tone="amber" delay="480ms" />

              {/* subtle shine */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -inset-y-6 -left-24 w-40 rotate-12 bg-white/35 blur-md animate-[shine_1.6s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <div className="text-sm font-extrabold tracking-wide text-neutral-600">
              OLIMPIADI MILANO-CORTINA 2026
            </div>
            <div className="mt-1 text-lg font-extrabold text-neutral-900">{label}</div>
            <div className="mt-2 text-xs text-neutral-500">
              Prepariamo la dashboard…
            </div>
          </div>
        </div>
      </div>

      {/* keyframes */}
      <style>{`
        @keyframes pulseRing {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.95; }
          50% { transform: translateY(-3px) scale(1.03); opacity: 1; }
        }
        @keyframes shine {
          0% { transform: translateX(-40px) rotate(12deg); opacity: 0; }
          30% { opacity: 0.9; }
          60% { opacity: 0.6; }
          100% { transform: translateX(360px) rotate(12deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Ring({ className, tone = "neutral", delay = "0ms" }) {
  const tones = {
    indigo: "border-indigo-500/80 shadow-[0_10px_25px_rgba(99,102,241,0.18)]",
    neutral: "border-neutral-800/70 shadow-[0_10px_25px_rgba(0,0,0,0.12)]",
    rose: "border-rose-500/75 shadow-[0_10px_25px_rgba(244,63,94,0.16)]",
    emerald: "border-emerald-500/75 shadow-[0_10px_25px_rgba(16,185,129,0.16)]",
    amber: "border-amber-500/75 shadow-[0_10px_25px_rgba(245,158,11,0.16)]",
  };

  return (
    <div
      className={cx(
          "h-14 w-14 rounded-full border-[6px] bg-white/25 backdrop-blur-sm",
        tones[tone] || tones.neutral,
        className
      )}
      style={{
        animation: `pulseRing 1.1s ease-in-out ${delay} infinite`,
      }}
    />
  );
}