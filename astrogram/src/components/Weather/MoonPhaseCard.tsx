import React from "react";
import { WiMoonrise, WiMoonset } from "react-icons/wi";
import { formatTimeForUnit } from "../../lib/time";

interface MoonPhaseCardProps {
  phase: string;               // "Waxing Crescent", "Full Moon", etc.
  illumination: number;        // 0..1 or 0..100
  moonrise?: string;           // "HH:MM:SS"
  moonset?: string;            // "HH:MM:SS"
  className: string;
  unit: "metric" | "us";
}

const phaseIcons: Record<string, string> = {
  "New Moon": "🌑",
  "Waxing Crescent": "🌒",
  "First Quarter": "🌓",
  "Waxing Gibbous": "🌔",
  "Full Moon": "🌕",
  "Waning Gibbous": "🌖",
  "Last Quarter": "🌗",
  "Waning Crescent": "🌘",
};

const MoonPhaseCard: React.FC<MoonPhaseCardProps> = ({
  phase,
  illumination,
  moonrise,
  moonset,
  className,
  unit,
}) => {
  const emoji = phaseIcons[phase] ?? "🌙";
  const fmt = (t?: string) => (t ? formatTimeForUnit(t, unit) : "--:--");
  const illumPct = normalizeIllumination(illumination);

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
          <h3 className="text-sm sm:text-base font-semibold text-slate-100">Moon</h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] text-violet-200 bg-violet-400/10 ring-1 ring-violet-400/30">
            {phase}
          </span>
        </div>

        {/* content fills remaining height */}
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-4 items-center flex-1">
          {/* donut */}
          <div className="relative w-full flex items-center justify-center">
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full"
              style={{
                background: `conic-gradient(#a78bfa ${illumPct}%, rgba(255,255,255,0.08) ${illumPct}% 100%)`,
              }}
              aria-label={`Illumination ${illumPct}%`}
              title={`Illumination: ${illumPct}%`}
            >
              <div className="absolute inset-2 rounded-full bg-slate-900/70 ring-1 ring-white/10" />
              <div
                className="absolute inset-[10%] rounded-full opacity-[.10] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.4px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]">
                  {emoji}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-100">
                  {illumPct}%
                </div>
                <div className="text-[10px] text-slate-300/80">illumination</div>
              </div>
            </div>
          </div>

          {/* rise/set */}
          <div className="flex flex-col items-end justify-center gap-3">
            <div className="inline-flex items-center gap-2 text-amber-200">
              <WiMoonrise className="w-6 h-6" />
              <span className="text-sm tabular-nums">{fmt(moonrise)}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-fuchsia-300">
              <WiMoonset className="w-6 h-6" />
              <span className="text-sm tabular-nums">{fmt(moonset)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MoonPhaseCard;

function normalizeIllumination(value: number): number {
  const pct = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
