import React from "react";
import { formatHourLabel } from "../../lib/time";
import type { WeatherDay, TimeBlock } from "../../types/weather";

type WeatherCardProps = {
  day: WeatherDay;
  isToday?: boolean;
  unit?: "metric" | "us";
  className?: string;
  forcedActiveBlock?: TimeBlock;
};

/* ------------------------------ Styling Maps ------------------------------ */
const levelColors: Record<number, string> = {
  1: "bg-red-600",
  2: "bg-orange-500",
  3: "bg-yellow-400",
  4: "bg-lime-400",
  5: "bg-green-500",
};

/* ---------------------------- Time/Condition Data ------------------------- */
const timeBlocks: TimeBlock[] = ["0", "3", "6", "12", "18", "21"];
const conditions: Array<keyof WeatherDay["conditions"]> = [
  "cloudcover",
  "visibility",
  "seeing",
];

const conditionLabels: Record<string, string> = {
  cloudcover: "Clouds",
  visibility: "Transparency",
  seeing: "Seeing",
};

/* --------------------------------- Icons ---------------------------------- */
const CloudIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M7 18h9a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.8A3.5 3.5 0 0 0 7 18Z" fill="currentColor" />
  </svg>
);
const EyeIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="12" cy="12" r="2.7" fill="currentColor" />
  </svg>
);
const SparkleIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M12 3l1.4 4.2L18 9l-4.2 1.4L12 15l-1.4-4.6L6 9l4.6-1.8L12 3Z" fill="currentColor" />
  </svg>
);

function ConditionIcon({ name }: { name: string }) {
  switch (name) {
    case "cloudcover": return <CloudIcon />;
    case "visibility": return <EyeIcon />;
    case "seeing":     return <SparkleIcon />;
    default:           return <span className="w-3 h-3 inline-block rounded-full bg-current" />;
  }
}

/* ---------------------------- Time Block Helper --------------------------- */
function getClosestTimeBlock(): TimeBlock {
  const now = new Date().getHours();
  const blocks = timeBlocks.map((tb) => parseInt(tb, 10)).sort((a, b) => a - b);
  let best = blocks[0];
  const circ = (a: number, b: number) => Math.min(Math.abs(a - b), 24 - Math.abs(a - b));
  for (const b of blocks) if (circ(b, now) < circ(best, now)) best = b;
  return String(best) as TimeBlock;
}

/* --------------------------------- Card ----------------------------------- */
const WeatherCard: React.FC<WeatherCardProps> = ({
  day,
  isToday = false,
  unit = "metric",
  className = "",
  forcedActiveBlock,
}) => {
  const activeTime: TimeBlock | null = isToday
    ? (forcedActiveBlock ?? getClosestTimeBlock())
    : null;

  // Responsive track size: shrinks on small screens to avoid horizontal overflow.
  const maxTrackPx = unit === "us" ? 52 : 40; // upper cap for larger screens
  const timeTrack = `clamp(28px, 8vw, ${maxTrackPx}px)`; // min 28px on tiny screens
  const pillMinW =
    unit === "us"
      ? "min-w-[36px] sm:min-w-[52px]"
      : "min-w-[32px] sm:min-w-[40px]";

  const dateLabel = new Date(day.date).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={[
        "relative overflow-hidden rounded-lg",
        "border border-white/10",
        "bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/20",
        "backdrop-blur-xl text-slate-100",
        "shadow-[0_16px_36px_rgba(2,6,23,0.35)]",
        className,
      ].join(" ")}
    >
      <div className="px-5 pb-4 pt-3">
        {/* Header */}
        <div className="relative flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold">{dateLabel}</h3>
          {isToday && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/12 text-cyan-300 px-2 py-0.5 text-[10px] font-medium ring-1 ring-cyan-400/30">
              <span className="block w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
              Today
            </span>
          )}
        </div>

        {/* Grid */}
        <div className="mt-2 min-w-0">
          <div
            className="grid gap-x-1.5 gap-y-2 items-center w-full"
            style={{ gridTemplateColumns: `minmax(72px,auto) repeat(6, minmax(${timeTrack}, 1fr))` }}
          >
            {/* Time headers */}
            <div className="text-[11px] text-slate-300/85 font-medium">Time</div>
            {timeBlocks.map((time) => {
              const hour = Number.parseInt(time, 10);
              const raw = formatHourLabel(hour, unit);
              const label = unit === "us" ? raw.replace(" ", "\u202F") : raw;
              const isActive = time === activeTime && isToday;

              return (
                <div key={time} className="flex justify-center min-w-0">
                  <div
                    className={[
                      "text-[10px] px-2 py-0.5 rounded-full text-center leading-4 whitespace-nowrap",
                      pillMinW,
                      "transition-colors duration-200",
                      isActive
                        ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30"
                        : "text-slate-300/70",
                    ].join(" ")}
                    aria-current={isActive ? "time" : undefined}
                  >
                    {label}
                  </div>
                </div>
              );
            })}

            {/* Condition rows */}
            {conditions.map((condition) => (
              <React.Fragment key={String(condition)}>
                <div className="flex items-center gap-1.5 text-[13px] text-slate-200">
                  <span className="text-slate-300/80">
                    <ConditionIcon name={String(condition)} />
                  </span>
                  <span className="capitalize">
                    {conditionLabels[String(condition)] ?? String(condition)}
                  </span>
                </div>

                {timeBlocks.map((time) => {
                  const rawValue = day.conditions[condition]?.[time];
                  const level = mapValueToLevel(String(condition), rawValue ?? 0);
                  const colorClass = levelColors[level] ?? "bg-gray-600";
                  const isActive = time === activeTime && isToday;

                  const hour = Number.parseInt(time, 10);
                  const raw = formatHourLabel(hour, unit);
                  const label = unit === "us" ? raw.replace(" ", "\u202F") : raw;

                  return (
                    <div key={`${String(condition)}-${time}`} className="flex justify-center min-w-0">
                      <div
                        className={[
                          "w-5 h-5 shrink-0 rounded-full",
                          colorClass,
                          "transition-transform duration-150",
                          "group-hover:scale-[1.05]",
                          isActive ? "outline outline-2 outline-sky-300" : "",
                        ].join(" ")}
                        title={`${String(condition)} at ${label} = ${rawValue ?? "N/A"}`}
                        aria-label={`${String(condition)} at ${label} = ${rawValue ?? "N/A"}`}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Mini legend */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-slate-300/80">Worst</span>
            <div className="relative mx-2 h-1.5 w-full rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-yellow-500 to-green-600 opacity-95" />
            </div>
            <span className="text-[10px] text-slate-300/80">Best</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;

/* ---------------------------- Value → Level Map --------------------------- */
export function mapValueToLevel(condition: string, value: number): number {
  if (value == null || isNaN(value)) return 1;

  switch (condition) {
    case "clouds":
    case "cloudcover":
      if (value <= 10) return 5;
      if (value <= 30) return 4;
      if (value <= 55) return 3;
      if (value <= 80) return 2;
      return 1;

    case "seeing":
      if (value <= 300) return 5;
      if (value <= 600) return 4;
      if (value <= 900) return 3;
      if (value <= 1200) return 2;
      return 1;

    case "transparency":
    case "humidity":
    case "relative_humidity_2m":
      if (value < 35) return 5;
      if (value < 50) return 4;
      if (value < 65) return 3;
      if (value < 80) return 2;
      return 1;

    case "visibility":
      if (value >= 24000) return 5;
      if (value >= 20000) return 4;
      if (value >= 16000) return 3;
      if (value >= 10000) return 2;
      return 1;

    case "precipitation":
    case "precipitation_probability":
      if (value < 5) return 5;
      if (value < 15) return 4;
      if (value < 30) return 3;
      if (value < 60) return 2;
      return 1;

    default:
      return 1;
  }
}
