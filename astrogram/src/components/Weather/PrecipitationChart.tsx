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
    if (!data) return [];

    return (
      Object.entries(data) as Array<[string, number | undefined]>
    )
      .map(([hourKey, rawValue]) => {
        if (rawValue == null) return null;

        const parsedHour = Number.parseInt(hourKey, 10);
        if (Number.isNaN(parsedHour)) return null;

        return {
          hour: parsedHour,
          label: formatHourLabel(parsedHour, unit),
          value: clampPercentage(rawValue),
        } satisfies BarDatum;
      })
      .filter((entry): entry is BarDatum => Boolean(entry))
      .sort((a, b) => a.hour - b.hour);
  }, [data, unit]);

  if (!bars.length) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-5 text-sm ${className}`}
      >
        No precipitation probability data is available for today.
      </div>
    );
  }

  return (
    <section
      className={`bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <header className="px-6 pt-5 flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-semibold">Precipitation probability</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chance of rain or snow at key observing hours.
          </p>
        </div>
        <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Percent chance
        </span>
      </header>

      <div className="px-6 pb-6 pt-4">
        <div
          role="img"
          aria-label="Bar chart showing precipitation probability by hour"
          className="h-56 flex items-end gap-4"
        >
          {bars.map((bar) => {
            const heightPercent = bar.value === 0 ? 4 : bar.value;
            const isActive =
              highlightHour != null && Math.round(bar.hour) === highlightHour;

            return (
              <div
                key={bar.hour}
                className="min-w-[3.25rem] flex flex-col items-center gap-2"
              >
                <span className="text-sm font-medium text-sky-600 dark:text-sky-300">
                  {bar.value}%
                </span>
                <div className="w-full flex-1 flex items-end justify-center">
                  <div
                    className={`w-full max-w-[2.75rem] rounded-t-xl bg-gradient-to-t from-sky-600 to-cyan-400 dark:from-sky-500 dark:to-cyan-300 transition-all duration-500 ${
                      isActive
                        ? "ring-2 ring-cyan-300 dark:ring-cyan-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                        : ""
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    aria-hidden="true"
                    title={`${bar.label}: ${bar.value}% chance of precipitation`}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PrecipitationChart;
