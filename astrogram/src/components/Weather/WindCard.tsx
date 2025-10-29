import React from "react";

export interface WindCardProps {
  speed: number;
  direction: number;
  unit?: string;
  className?: string;
}

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function getCardinal(angle: number) {
  const deg = ((angle % 360) + 360) % 360;
  const idx = Math.floor((deg + 22.5) / 45) % 8;
  return CARDINALS[idx];
}
const tickAngles = [0, 45, 90, 135, 180, 225, 270, 315];

const WindCard: React.FC<WindCardProps> = ({
  speed,
  direction,
  unit = "km/h",
  className = "",
}) => {
  const cardinal = getCardinal(direction);
  const deg = ((direction % 360) + 360) % 360;

  return (
    <section
      className={[
        className ?? "",
        "h-full group relative w-full",
        "rounded-2xl p-[1px]",
        "bg-[conic-gradient(at_20%_10%,rgba(34,211,238,.35),rgba(168,85,247,.28),rgba(16,185,129,.35),rgba(34,211,238,.35))]",
      ].join(" ")}
    >
      <div className="h-full rounded-2xl bg-slate-900/60 backdrop-blur-md ring-1 ring-white/10 shadow-[0_8px_28px_rgba(2,6,23,.44)] p-4 flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-slate-100">Wind</h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] text-cyan-200 bg-cyan-400/10 ring-1 ring-cyan-400/30">
            {cardinal} • {Math.round(direction)}°
          </span>
        </div>

        {/* content fills remaining height */}
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-4 items-center flex-1">
          {/* Compass */}
          <div className="relative aspect-square max-w-[180px] sm:max-w-[200px] w-full mx-auto">
            <div
              className="absolute inset-0 rounded-full ring-1 ring-white/10"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,255,255,.06), transparent 60%), conic-gradient(from 0deg, rgba(255,255,255,.06) 0deg 360deg)",
              }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-[.08]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.4px)",
                backgroundSize: "22px 22px",
              }}
            />
            {tickAngles.map((a) => (
              <div
                key={a}
                className="absolute left-1/2 top-1/2 w-[2px] h-[16%] bg-white/25 origin-bottom"
                style={{ transform: `translate(-50%, -100%) rotate(${a}deg)` }}
              />
            ))}
            {[
              { a: 0, t: "N" },
              { a: 90, t: "E" },
              { a: 180, t: "S" },
              { a: 270, t: "W" },
            ].map(({ a, t }) => (
              <div
                key={t}
                className="absolute left-1/2 top-1/2 text-[11px] font-semibold text-slate-200"
                style={{
                  transform: `translate(-50%, -50%) rotate(${a}deg) translateY(-78%) rotate(${-a}deg)`,
                }}
              >
                {t}
              </div>
            ))}
            {/* Pointer */}
            <div
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{ transform: `translate(-50%, -100%) rotate(${deg}deg)` }}
              aria-label={`Wind direction ${cardinal} ${Math.round(direction)} degrees`}
            >
              <svg width="8" height="90" viewBox="0 0 8 90" fill="none">
                <rect x="3.25" y="14" width="1.5" height="62" rx="0.75" fill="url(#g1)" />
                <path d="M4 0 L8 14 H0 Z" fill="url(#g2)" />
                <circle cx="4" cy="78" r="6" fill="url(#g3)" opacity=".9" />
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <radialGradient id="g3">
                    <stop offset="0%" stopColor="rgba(255,255,255,.9)" />
                    <stop offset="100%" stopColor="rgba(56,189,248,.75)" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Speed */}
          <div className="flex flex-col items-end justify-center">
            <div className="text-4xl sm:text-5xl font-bold text-white leading-none">
              {Math.round(speed)}
            </div>
            <div className="text-sm text-slate-300 mt-1">{unit}</div>
            <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 ring-1 ring-white/10 text-[12px] text-slate-200">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.6)]" />
              {cardinal} • {Math.round(direction)}°
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WindCard;
