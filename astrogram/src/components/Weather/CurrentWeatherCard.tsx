// src/components/Weather/CurrentWeatherCard.tsx
import React from "react";
import { WiSunrise, WiSunset } from "react-icons/wi";
import { formatTimeForUnit } from "../../lib/time";

type Props = {
  location?: string;
  date?: string;
  temperature: number;
  condition: string;
  icon: string;          // emoji
  sunrise?: string;
  sunset?: string;
  unit: "metric" | "us";
  onToggle: () => void;
  /** Optional extra classes if you want to override width/margins */
  className?: string;
};

const CurrentWeatherCard: React.FC<Props> = ({
  location,
  date,
  temperature,
  condition,
  icon,
  sunrise,
  sunset,
  unit,
  onToggle,
  className = "",
}) => {
  const fmt = (t?: string) => (t ? formatTimeForUnit(t, unit) : "");

  return (
    <div className={`relative w-full max-w-[860px] mx-auto ${className}`}>
      {/* Background glow + subtle stars */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-[24px]">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[40vh] w-[75vw] rounded-full bg-gradient-to-br from-[#6f4cff]/18 via-[#a855f7]/14 to-[#10b981]/18 blur-[72px]" />
        <div className="absolute -bottom-24 -right-16 h-[30vh] w-[40vw] rounded-full bg-gradient-to-tr from-[#10b981]/15 via-[#38bdf8]/15 to-transparent blur-[70px]" />
        <div
          className="absolute inset-0 opacity-[.22]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1.2px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#2a134a] via-[#1c184b] to-[#0b0f2a] ring-1 ring-white/10 shadow-[0_18px_60px_rgba(2,6,23,.45)]">
        {/* ABSOLUTE TOGGLE — top-right edge */}
        <label className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex items-center gap-2 text-xs text-slate-200/85 cursor-pointer select-none">
          <span className={unit === "metric" ? "text-white" : "text-slate-400"}>°C</span>
          <input
            type="checkbox"
            checked={unit === "us"}
            onChange={onToggle}
            className="sr-only peer"
            aria-label="Toggle temperature unit"
          />
          <div
            className="
              relative w-10 h-5 rounded-full
              bg-slate-600/70 ring-1 ring-white/10
              peer-checked:bg-cyan-500/70 transition-colors
              after:absolute after:top-[2px] after:left-[2px]
              after:h-4 after:w-4 after:rounded-full after:bg-white
              after:shadow-[0_4px_12px_rgba(0,0,0,.25)]
              after:transition-transform peer-checked:after:translate-x-5
            "
          />
          <span className={unit === "us" ? "text-white" : "text-slate-400"}>°F</span>
        </label>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-4 p-5 sm:p-6 lg:p-7">
          {/* LEFT */}
          <div className="flex flex-col min-w-0 pr-10"> {/* pr-10 leaves room under the toggle */}
            {/* Header (inside card) */}
            <div className="min-w-0">
              {location && (
                <h1 className="truncate text-[22px] sm:text-2xl font-semibold text-white">
                  {location}
                </h1>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
                <span className="text-slate-200/95">{condition}</span>
                {date && <span className="text-slate-400/70">• {date}</span>}
              </div>
            </div>

            {/* Sunrise / Sunset */}
            {(sunrise || sunset) && (
              <div className="mt-4 flex items-center gap-6 text-[13px]">
                {sunrise && (
                  <div className="inline-flex items-center gap-2 text-amber-300">
                    <WiSunrise className="w-6 h-6" />
                    <span className="tabular-nums">{fmt(sunrise)}</span>
                  </div>
                )}
                {sunset && (
                  <div className="inline-flex items-center gap-2 text-rose-400">
                    <WiSunset className="w-6 h-6" />
                    <span className="tabular-nums">{fmt(sunset)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Temperature */}
            <div className="mt-6 sm:mt-7 lg:mt-9">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white">
                  {Number.isFinite(temperature) ? temperature.toFixed(1) : "--"}
                </span>
                <span className="text-3xl sm:text-4xl text-slate-200">
                  °{unit === "metric" ? "C" : "F"}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: big emoji */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -z-10 right-6 bottom-4 h-36 w-36 sm:h-44 sm:w-44 rounded-full blur-2xl bg-cyan-500/15" />
            <div className="text-[72px] sm:text-[96px] lg:text-[112px] drop-shadow-[0_8px_14px_rgba(0,0,0,.35)]">
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeatherCard;
