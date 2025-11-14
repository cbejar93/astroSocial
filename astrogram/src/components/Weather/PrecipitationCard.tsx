import React, { useMemo } from "react";
import type { TimeBlock } from "../../types/weather";
import PrecipitationChart from "./PrecipitationChart";

export interface PrecipitationCardProps {
  /** Hourly probability map: keys "0"…"23", values 0–100 (%) */
  hourlyProbability?: Record<string, number>;
  /** Hourly intensity map: keys "0"…"23", values in mm/h (metric) */
  hourlyAmountMm?: Record<string, number>;
  /** Which hour to start from (usually “current” hour) */
  activeHour?: TimeBlock;
  /** Unit system for display */
  unit?: "metric" | "us";
  className?: string;
}

const toInches = (mm: number) => mm / 25.4;

const coerceNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const coercePercent = (value: unknown): number | null => {
  const numeric = coerceNumber(value);
  if (numeric === null) return null;
  if (numeric <= 0) return 0;
  if (numeric >= 100) return 100;
  return Math.round(numeric);
};

const safeNum = (value: unknown, fallback = 0): number => {
  const numeric = coerceNumber(value);
  return numeric === null ? fallback : numeric;
};

const PrecipitationCard: React.FC<PrecipitationCardProps> = ({
  hourlyProbability = {},
  hourlyAmountMm = {},
  activeHour,
  unit = "metric",
  className = "",
}) => {
  // sanitize keys to "0"…"23"
  const probMap = useMemo(() => {
    const out: Partial<Record<TimeBlock, number>> = {};
    if (!hourlyProbability) return out;

    for (let h = 0; h < 24; h++) {
      const key = String(h) as TimeBlock;
      const percent = coercePercent(hourlyProbability[key]);
      if (percent !== null) out[key] = percent;
    }

    return out;
  }, [hourlyProbability]);

  const currentKey = (activeHour ?? "0") as TimeBlock;
  const nowProb = Math.max(0, Math.min(100, Math.round(safeNum(probMap[currentKey]))));
  const nowAmtMm = Math.max(0, safeNum(hourlyAmountMm[currentKey]));
  const nowAmtLabel =
    unit === "us"
      ? `${toInches(nowAmtMm).toFixed(nowAmtMm >= 25.4 ? 2 : 3)} in/hr`
      : `${nowAmtMm.toFixed(nowAmtMm >= 1 ? 1 : 2)} mm/hr`;

  const startHour = Math.max(0, Math.min(23, Number(currentKey) || 0));

  return (
    <section
      className={[
        className ?? "",
        "group relative w-full rounded-2xl p-[1px]",
        "bg-[conic-gradient(at_20%_10%,rgba(34,211,238,.35),rgba(168,85,247,.28),rgba(16,185,129,.35),rgba(34,211,238,.35))]",
      ].join(" ")}
      aria-label="Precipitation"
    >
      <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md ring-1 ring-white/10 shadow-[0_8px_28px_rgba(2,6,23,.44)] p-4 flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-slate-100">
            Precipitation
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] text-sky-200 bg-sky-400/10 ring-1 ring-sky-400/30">
            Next 24h
          </span>
        </div>

        {/* current stat */}
        <div className="mt-3 mb-2 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true">
              <path
                d="M9 0C9 0 2 7 2 12.5C2 17.1944 5.35786 21 9 21C12.6421 21 16 17.1944 16 12.5C16 7 9 0 9 0Z"
                fill="url(#grad)"
                opacity="0.9"
              />
              <defs>
                <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-4xl sm:text-5xl font-bold text-white leading-none">
              {nowProb}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Intensity (now)</div>
            <div className="text-sm sm:text-base font-medium text-slate-200">
              {nowAmtLabel}
            </div>
          </div>
        </div>

        {/* your chart, embedded bare inside the fancy card */}
        <PrecipitationChart
          data={probMap}
          unit={unit}
          startHour={startHour}
          className="
            !bg-transparent !dark:bg-transparent !shadow-none !border-0
            !rounded-none p-0
          "
        //   scrollClassName="scrollbar-cute"
        />
      </div>
    </section>
  );
};

export default PrecipitationCard;
