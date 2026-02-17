import React, { useMemo } from "react";
import { formatHourLabel } from "../../lib/time";
import type { TimeBlock } from "../../types/weather";

export interface PrecipitationChartProps {
  data?: Partial<Record<TimeBlock, number>>;
  unit?: "metric" | "us";
  /**
   * First hour (0-23) that should be included in the chart. Earlier hours will be hidden.
   */
  startHour?: number;
  /** Extra classes for the OUTER <section> */
  className?: string;
  /** Extra classes for the INNER overflow scroller (so we can style the scrollbar) */
  scrollClassName?: string;
}

type BarDatum = {
  hour: number;
  label: string;
  value: number;
};

const clampPercentage = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
};

const PrecipitationChart: React.FC<PrecipitationChartProps> = ({
  data,
  unit = "metric",
  startHour = 0,
  className = "",
  scrollClassName = "",
}) => {
  const normalizedStartHour = useMemo(() => {
    if (!Number.isFinite(startHour)) return 0;
    const floored = Math.floor(startHour);
    if (floored < 0) return 0;
    if (floored > 23) return 23;
    return floored;
  }, [startHour]);

  const bars = useMemo<BarDatum[]>(() => {
    const totalBars = 24 - normalizedStartHour;

    return Array.from({ length: totalBars }, (_, index) => {
      const hour = normalizedStartHour + index;
      const key = hour.toString() as TimeBlock;
      const rawValue = data?.[key] ?? 0;

      return {
        hour,
        label: formatHourLabel(hour, unit),
        value: clampPercentage(rawValue),
      } satisfies BarDatum;
    });
  }, [data, unit, normalizedStartHour]);

  const hasData = bars.length > 0 && Boolean(data && Object.keys(data).length > 0);

  return (
    <section
      className={`bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow border border-gray-200 dark:border-gray-700 flex flex-col ${className}`}
    >
      <header className="px-5 sm:px-6 pt-4 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold sm:text-base">
            Precipitation probability
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Hourly chance of rain or snow today.
          </p>
        </div>
        <span className="text-[0.65rem] sm:text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Percent chance
        </span>
      </header>

      <div className="px-5 sm:px-6 pb-5 pt-3 flex-1 flex">
        {hasData ? (
          <div className={`overflow-x-auto flex-1 ${scrollClassName}`}>
            <div
              role="img"
              aria-label="Bar chart showing precipitation probability by hour"
              className="relative min-h-[10rem] md:min-h-[178px] h-full flex items-end gap-2.5 min-w-max pr-2 rounded-xl bg-slate-900/40 dark:bg-slate-900/50"
            >
              <div className="pointer-events-none absolute inset-x-3 bottom-[12%] h-px bg-slate-300/20 dark:bg-white/10" />
              {bars.map((bar) => {
                const heightStyle =
                  bar.value <= 0
                    ? "2px"
                    : `max(calc(${bar.value}% + 4px), 10px)`; // always visible and taller than zero bars
                const opacity =
                  bar.value <= 0
                    ? 0.2
                    : 0.35 + (bar.value / 100) * 0.65;

                return (
                  <div
                    key={bar.hour}
                    className="min-w-[2.25rem] flex flex-col items-center gap-1.5"
                  >
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-300">
                      {bar.value}%
                    </span>
                    <div className="w-full flex items-end justify-center h-[120px] sm:h-[150px]">
                      <div
                        className="w-full max-w-[1.75rem] rounded-t-lg bg-gradient-to-t from-sky-600 to-cyan-400 dark:from-sky-500 dark:to-cyan-300 shadow-[0_0_6px_rgba(56,189,248,0.35)] transition-all duration-500"
                        style={{ height: heightStyle, opacity }}
                        aria-hidden="true"
                        title={`${bar.label}: ${bar.value}% chance of precipitation`}
                      />
                    </div>
                    <span className="text-[0.65rem] font-medium text-gray-600 dark:text-gray-300">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 text-center">
            No precipitation probability data is available for today.
          </div>
        )}
      </div>
    </section>
  );
};

export default PrecipitationChart;
