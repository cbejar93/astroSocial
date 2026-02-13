// src/pages/WeatherPage.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import CurrentWeatherCard from "../components/Weather/CurrentWeatherCard";
import WeatherCard from "../components/Weather/WeatherCard";
import MoonPhaseCard from "../components/Weather/MoonPhaseCard";
import WeatherSkeleton from "../components/Weather/WeatherSkeleton";
import WindCard from "../components/Weather/WindCard";
import PrecipitationCard from "../components/Weather/PrecipitationCard";
import { isWithinDaylight } from "../lib/time";
import type { WeatherData } from "../types/weather";
import type { TimeBlock } from "../types/weather";
import { useAuth } from "../hooks/useAuth";
import PageContainer from "../components/Layout/PageContainer";

export { isWithinDaylight, parseTimeParts } from "../lib/time";

interface WeatherPageProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  unit: "metric" | "us";
  setUnit: Dispatch<SetStateAction<"metric" | "us">>;
}

export interface ZonedDateInfo {
  isoDate: string;
  hour: number;
  minute: number;
  formattedDate: string;
}

/* --------------------------- Timezone helper --------------------------- */
export const getZonedDateInfo = (
  timeZone: string,
  referenceDate: Date = new Date(),
): ZonedDateInfo => {
  const zone = timeZone || "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(referenceDate)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {} as Record<string, string>);

  const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = Number.parseInt(parts.hour ?? "0", 10);
  const minute = Number.parseInt(parts.minute ?? "0", 10);

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    dateStyle: "long",
  }).format(referenceDate);

  return { isoDate, hour, minute, formattedDate };
};

// Shared fixed height for Moon / Wind cards
const SECONDARY_CARD_HEIGHT = "h-[248px] sm:h-[268px]";

type HourlyNumberMap = Record<string, number>;
const EMPTY_NUM_MAP: HourlyNumberMap = {};

const SLOTS_24 = [0, 3, 6, 12, 18, 21] as const;

export const selectActiveSlot = (slots: readonly number[], currentHour: number) => {
  for (const slot of slots) {
    if (slot >= currentHour) return slot;
  }
  return slots[slots.length - 1] ?? 0;
};

/* --------------------------------- Page ---------------------------------- */
const WeatherPage: React.FC<WeatherPageProps> = ({
  weather,
  loading,
  error,
  unit,
  setUnit,
}) => {
  const { user, updateTemperaturePreference } = useAuth();
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);

  // desktop scrollers (preserve position on unit switch)
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const asideScrollRef = useRef<HTMLDivElement | null>(null);

  // Respect saved preference on mount/changes
  useEffect(() => {
    if (!user?.temperature) return;
    const preferredUnit = user.temperature === "F" ? "us" : "metric";
    setUnit((current) => (current === preferredUnit ? current : preferredUnit));
  }, [user?.temperature, setUnit]);

  const handleToggleUnit = useCallback(async () => {
    if (savingPreference) return;

    // snapshot both scroll containers (desktop)
    const prevLeftTop = leftScrollRef.current?.scrollTop ?? 0;
    const prevRightTop = asideScrollRef.current?.scrollTop ?? 0;

    const previousUnit = unit;
    const nextUnit = unit === "metric" ? "us" : "metric";
    setPreferenceError(null);
    setSavingPreference(true);

    // optimistic local toggle (no page refresh)
    setUnit(nextUnit);

    // restore scroll next frame to avoid jump
    requestAnimationFrame(() => {
      if (leftScrollRef.current) leftScrollRef.current.scrollTop = prevLeftTop;
      if (asideScrollRef.current) asideScrollRef.current.scrollTop = prevRightTop;
    });

    if (!user) {
      setSavingPreference(false);
      return;
    }

    try {
      await updateTemperaturePreference(nextUnit === "metric" ? "C" : "F");
    } catch (err) {
      console.error(err);
      setUnit(previousUnit);
      setPreferenceError("Unable to save temperature preference. Please try again.");
      requestAnimationFrame(() => {
        if (leftScrollRef.current) leftScrollRef.current.scrollTop = prevLeftTop;
        if (asideScrollRef.current) asideScrollRef.current.scrollTop = prevRightTop;
      });
    } finally {
      setSavingPreference(false);
    }
  }, [savingPreference, unit, setUnit, user, updateTemperaturePreference]);

  const resolvedLocalZone =
    typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";
  const timeZone = weather?.timezone ?? resolvedLocalZone ?? "UTC";

  // ---- Hooks before early returns ----
  const zonedNow = useMemo(() => getZonedDateInfo(timeZone), [timeZone]);
  const todayStr = zonedNow.isoDate;

  const todayData = useMemo(
    () => (weather?.data ?? []).find((day) => day.date === todayStr),
    [weather, todayStr],
  );

  const speedMap: HourlyNumberMap =
    todayData?.conditions?.windspeed ?? EMPTY_NUM_MAP; // km/h
  const directionMap: HourlyNumberMap =
    todayData?.conditions?.winddirection ?? EMPTY_NUM_MAP;
  const tempMap: HourlyNumberMap =
    todayData?.conditions?.temperature ?? EMPTY_NUM_MAP; // °C
  const conditionMap: HourlyNumberMap =
    todayData?.conditions?.cloudcover ?? EMPTY_NUM_MAP; // %

  // Precipitation maps — tolerate different backend keys safely
  const c = (todayData?.conditions as any) ?? {};
  const precipProbMap: HourlyNumberMap =
    (c.precipitation ??
      c.precipprob ??
      c.precipProb ??
      c.precipProbability ??
      EMPTY_NUM_MAP) as HourlyNumberMap; // %
  const precipAmtMmMap: HourlyNumberMap =
    (c.precip ??
      c.precip_mm ??
      c.precipAmount ??
      EMPTY_NUM_MAP) as HourlyNumberMap; // mm/hr

  const hourKeys = useMemo(() => {
    const arrays = [
      Object.keys(tempMap),
      Object.keys(conditionMap),
      Object.keys(speedMap),
      Object.keys(directionMap),
    ].filter((a) => a.length > 0);

    if (arrays.length === 0) return [] as string[];
    if (arrays.length === 1) return arrays[0];

    const intersection = arrays.slice(1).reduce<string[]>(
      (acc, arr) => acc.filter((k) => arr.includes(k)),
      arrays[0]
    );
    return intersection.length ? intersection : arrays[0];
  }, [tempMap, conditionMap, speedMap, directionMap]);

  const futureWeatherData = useMemo(
    () => (weather?.data ?? []).filter((day) => day.date >= todayStr),
    [weather, todayStr],
  );

  // Decide the active slot once (timezone-aware)
  const activeSlot24 = useMemo(
    () => selectActiveSlot(SLOTS_24, zonedNow.hour),
    [zonedNow.hour],
  );

  // ---- Early returns ----
  if (loading) return <WeatherSkeleton />;
  if (error) return <div className="text-red-500 text-center py-6">{error}</div>;
  if (!weather?.data?.length)
    return (
      <div className="text-center text-gray-400 py-6">
        No weather data available.
      </div>
    );

  const sunrise = todayData?.astro?.sunrise;
  const sunset = todayData?.astro?.sunset;

  const isDaytime = todayData?.astro
    ? isWithinDaylight(
        todayData.astro.sunrise,
        todayData.astro.sunset,
        zonedNow.hour,
        zonedNow.minute,
      )
    : zonedNow.hour >= 6 && zonedNow.hour < 18;

  const circ = (a: number, b: number) =>
    Math.min(Math.abs(a - b), 24 - Math.abs(a - b));

  const chosenKey =
    hourKeys.length > 0
      ? hourKeys.reduce((best, cur) => {
          const b = Number(best);
          const c = Number(cur);
          return circ(c, zonedNow.hour) < circ(b, zonedNow.hour) ? cur : best;
        }, hourKeys[0]!)
      : "0";

  // Raw values from backend (already in requested unit)
  const rawWindSpeed = speedMap[chosenKey] ?? 0;
  const rawWindDirection = directionMap[chosenKey] ?? 0;
  const rawTemp = tempMap[chosenKey] ?? 0;

  const currentCondition = (() => {
    const v = conditionMap[chosenKey];
    if (v === undefined || Number.isNaN(v)) return "Unknown";
    if (v < 20) return "Clear";
    if (v < 50) return "Partly Cloudy";
    if (v < 80) return "Cloudy";
    return "Overcast";
  })();

  const icon = (() => {
    switch (currentCondition) {
      case "Clear":
        return isDaytime ? "☀️" : "🌕";
      case "Partly Cloudy":
        return isDaytime ? "⛅️" : "🌥️";
      case "Cloudy":
        return "☁️";
      case "Overcast":
        return "🌫️";
      default:
        return "❓";
    }
  })();

  const toTimeBlock = (n: number): TimeBlock => String(n) as TimeBlock;

  const windUnitLabel = unit === "us" ? "mph" : "km/h";

  return (
    <div className="relative overflow-x-hidden">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-12%] h-[42vh] w-[70vw] -translate-x-1/2 rounded-[999px] bg-gradient-to-br from-sky-500/15 via-fuchsia-500/10 to-emerald-500/15 blur-3xl" />
        <div className="absolute right-0 bottom-[-20%] translate-x-1/4 sm:translate-x-0 h-[36vh] w-[80vw] rounded-[999px] bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl" />
      </div>

      {/* fixed shell */}
      <div className="w-full pt-2 pb-8 lg:py-0 lg:fixed lg:inset-0 lg:overflow-hidden">
        <PageContainer size="wide" className="lg:h-full lg:min-h-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)] lg:gap-8">
          {/* LEFT column (scrollable on lg+) */}
          <div className="lg:h-full lg:min-h-0 lg:flex lg:flex-col lg:justify-center">
            <div
              ref={leftScrollRef}
              className="
                lg:max-h-[78vh] lg:overflow-y-auto lg:overscroll-contain
                [scrollbar-gutter:stable]
                pr-0
                scrollbar-cute
              "
            >
              {/* MOBILE-ONLY constant row spacing */}
              <div className="flex flex-col space-y-4 lg:space-y-0">
                <CurrentWeatherCard
                  className="max-w-none"
                  location={String(weather.coordinates)}
                  date={zonedNow.formattedDate}
                  temperature={rawTemp}
                  condition={currentCondition}
                  icon={icon}
                  sunrise={sunrise}
                  sunset={sunset}
                  unit={unit}
                  onToggle={handleToggleUnit}
                />

                {/* ===== MOBILE upcoming forecast scroller (edge-to-edge from left) ===== */}
                <section aria-label="Upcoming forecast (mobile)" className="lg:hidden">
                  <div
                    className="
                      -mx-4 overflow-x-auto snap-x snap-mandatory
                      [scrollbar-gutter:stable]
                      scrollbar-cute
                    "
                  >
                    <div className="flex gap-3 pr-4">
                      {futureWeatherData.map((day, index) => (
                        <div
                          key={day.date}
                          className="
                            flex-shrink-0
                            min-w-[420px] max-w-[480px]
                            snap-start
                          "
                        >
                          <WeatherCard
                            day={day}
                            isToday={index === 0}
                            unit={unit}
                            timezone={timeZone}
                            utcOffsetSeconds={weather?.utcOffsetSeconds ?? 0}
                            forcedActiveBlock={
                              index === 0 ? toTimeBlock(activeSlot24) : undefined
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                {/* ===== end mobile scroller ===== */}

                {/* Secondary cards — Moon + Wind (two columns on sm+) */}
                {todayData?.astro && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch lg:mt-6">
                    <MoonPhaseCard
                      className={`h-full ${SECONDARY_CARD_HEIGHT}`}
                      phase={todayData.astro.moonPhase.phase}
                      illumination={todayData.astro.moonPhase.illumination}
                      moonrise={todayData.astro.moonrise}
                      moonset={todayData.astro.moonset}
                      unit={unit}
                    />
                    <WindCard
                      className={`h-full ${SECONDARY_CARD_HEIGHT}`}
                      speed={rawWindSpeed}
                      direction={rawWindDirection}
                      unit={windUnitLabel}
                    />
                    {/* Precipitation — full-width row for wider chart */}
                    <PrecipitationCard
                      className="sm:col-span-2"
                      hourlyProbability={precipProbMap}
                      hourlyAmountMm={precipAmtMmMap}
                      activeHour={toTimeBlock(activeSlot24)}
                      unit={unit}
                    />
                  </div>
                )}
              </div>

              {preferenceError && (
                <p className="mt-3 text-center text-sm text-red-400 px-4">
                  {preferenceError}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT column — scrolls inside (desktop only) */}
          <aside
            aria-label="Upcoming forecast"
            className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:justify-center"
          >
            <div
              ref={asideScrollRef}
              className="
                relative max-h-[78vh] overflow-y-auto overscroll-contain
                rounded-2xl bg-slate-900/30 ring-1 ring-white/10
                shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_10px_30px_rgba(2,6,23,.35)]
                p-3 pr-3 w-full
                [scrollbar-gutter:stable_both-edges]
                scrollbar-cute
              "
            >
              <div className="flex flex-col gap-3 pr-1">
                {futureWeatherData.map((day, index) => (
                  <WeatherCard
                    key={day.date}
                    day={day}
                    isToday={index === 0}
                    unit={unit}
                    timezone={timeZone}
                    utcOffsetSeconds={weather?.utcOffsetSeconds ?? 0}
                    forcedActiveBlock={
                      index === 0 ? toTimeBlock(activeSlot24) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          </aside>
        </PageContainer>
      </div>
    </div>
  );
};

export default WeatherPage;
