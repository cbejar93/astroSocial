import React, { useMemo } from "react";
import { formatHourLabel } from "../../lib/time";
import type { TimeBlock } from "../../types/weather";

interface PrecipitationChartProps {
  data?: Partial<Record<TimeBlock, number>>;
  unit?: "metric" | "us";
  /**
   * Hour (0-23) that should be highlighted to indicate the current or closest observation time.
   */
  highlightHour?: number | null;
  className?: string;
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
  highlightHour,
  className = "",
}) => {
  const bars = useMemo<BarDatum[]>(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const key = hour.toString() as TimeBlock;
      const rawValue = data?.[key] ?? 0;

      return {
        hour,
        label: formatHourLabel(hour, unit),
        value: clampPercentage(rawValue),
      } satisfies BarDatum;
    });
  }, [data, unit]);

  const hasData = Boolean(data && Object.keys(data).length > 0);

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
          <div className="overflow-x-auto flex-1">
            <div
              role="img"
              aria-label="Bar chart showing precipitation probability by hour"
              className="min-h-[10rem] sm:min-h-[12rem] h-full flex items-end gap-2.5 min-w-max pr-2"
            >
              {bars.map((bar) => {
                const heightPercent = bar.value === 0 ? 4 : bar.value;
                const isActive =
                  highlightHour != null && Math.round(bar.hour) === highlightHour;

                return (
                  <div
                    key={bar.hour}
                    className="min-w-[2.25rem] flex flex-col items-center gap-1.5"
                  >
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-300">
                      {bar.value}%
                    </span>
                    <div className="w-full flex-1 flex items-end justify-center">
                      <div
                        className={`w-full max-w-[1.75rem] rounded-t-lg bg-gradient-to-t from-sky-600 to-cyan-400 dark:from-sky-500 dark:to-cyan-300 transition-all duration-500 ${
                          isActive
                            ? "ring-2 ring-cyan-300 dark:ring-cyan-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900"
                            : ""
                        }`}
                        style={{ height: `${heightPercent}%` }}
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
