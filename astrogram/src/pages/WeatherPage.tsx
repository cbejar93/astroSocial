import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import WeatherHeader from "../components/Weather/WeatherHeader";
import CurrentWeatherCard from "../components/Weather/CurrentWeatherCard";
import WeatherCard from "../components/Weather/WeatherCard";
import MoonPhaseCard from "../components/Weather/MoonPhaseCard";
import WeatherSkeleton from "../components/Weather/WeatherSkeleton";
import WindCard from "../components/Weather/WindCard";
import { isWithinDaylight } from "../lib/time";
import type { WeatherData } from "../types/weather";
import { useAuth } from "../hooks/useAuth";
import PrecipitationChart from "../components/Weather/PrecipitationChart";

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
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const isoDate = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = Number.parseInt(parts.hour ?? "0", 10);
  const minute = Number.parseInt(parts.minute ?? "0", 10);

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    dateStyle: "long",
  }).format(referenceDate);

  return { isoDate, hour, minute, formattedDate };
};

export { isWithinDaylight, parseTimeParts } from "../lib/time";

const WeatherPage: React.FC<WeatherPageProps> = ({ weather, loading, error, unit, setUnit }) => {
  const { user, updateTemperaturePreference } = useAuth();
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.temperature) return;
    const preferredUnit = user.temperature === 'F' ? 'us' : 'metric';
    setUnit((current) => (current === preferredUnit ? current : preferredUnit));
  }, [user?.temperature, setUnit]);

  const handleToggleUnit = useCallback(async () => {
    if (savingPreference) return;

    const previousUnit = unit;
    const nextUnit = unit === 'metric' ? 'us' : 'metric';
    setPreferenceError(null);
    setSavingPreference(true);
    setUnit(nextUnit);

    if (!user) {
      setSavingPreference(false);
      return;
    }

    try {
      await updateTemperaturePreference(nextUnit === 'metric' ? 'C' : 'F');
    } catch (err) {
      console.error(err);
      setUnit(previousUnit);
      setPreferenceError('Unable to save temperature preference. Please try again.');
    } finally {
      setSavingPreference(false);
    }
  }, [savingPreference, unit, setUnit, user, updateTemperaturePreference]);

  const resolvedLocalZone =
    typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";
  const timeZone = weather?.timezone ?? resolvedLocalZone ?? "UTC";

  const zonedNow = useMemo(() => getZonedDateInfo(timeZone), [timeZone]);
  const todayStr = zonedNow.isoDate;

  const todayData = useMemo(
    () => (weather?.data ?? []).find((day) => day.date === todayStr),
    [weather, todayStr],
  );

  const futureWeatherData = useMemo(
    () => (weather?.data ?? []).filter((day) => day.date >= todayStr),
    [weather, todayStr],
  );

  if (loading) return <WeatherSkeleton />;
  if (error) return <div className="text-red-500 text-center py-6">{error}</div>;
  if (!weather || !weather.data)
    return <div className="text-center text-gray-400 py-6">No weather data available.</div>;

  const sunrise = todayData?.astro?.sunrise;
  const sunset = todayData?.astro?.sunset;

  const isDaytime = todayData?.astro
    ? isWithinDaylight(
        todayData.astro.sunrise,
        todayData.astro.sunset,
        zonedNow.hour,
        zonedNow.minute,
      )
    : true;

  const speedMap = todayData?.conditions.windspeed ?? {};
  const directionMap = todayData?.conditions.winddirection ?? {};
  const tempMap = todayData?.conditions.temperature ?? {};
  const conditionMap = todayData?.conditions.cloudcover ?? {};
  const precipitationMap = todayData?.conditions.precipitation ?? {};

  const available = Object.keys(speedMap).map((h) => parseInt(h, 10));
  let chosenHour = available.length ? available[0] : 0;

  if (available.length) {
    chosenHour = available.reduce((prev, curr) => {
      return Math.abs(curr - zonedNow.hour) < Math.abs(prev - zonedNow.hour) ? curr : prev;
    }, available[0]);
  }

  const currentWindSpeed = speedMap[chosenHour];
  const currentWindDirection = directionMap[chosenHour];
  const currentTemp = tempMap[chosenHour];
  const currentCondition = getConditionFromClouds(conditionMap[chosenHour]);

  const precipitationHours = Object.keys(precipitationMap).map((h) =>
    Number.parseInt(h, 10),
  );
  const highlightedPrecipitationHour = precipitationHours.length
    ? precipitationHours.reduce((prev, curr) =>
        Math.abs(curr - zonedNow.hour) < Math.abs(prev - zonedNow.hour)
          ? curr
          : prev,
      precipitationHours[0])
    : null;

  const icon = getWeatherIcon(currentCondition, isDaytime);

  return (
    <div className="w-full py-8 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4">
        <WeatherHeader
          location={weather.coordinates}
          date={zonedNow.formattedDate}
        />

        <CurrentWeatherCard
          temperature={currentTemp}
          condition={currentCondition}
          icon={icon}
          sunrise={sunrise}
          sunset={sunset}
          unit={unit}
          onToggle={handleToggleUnit}
        />

        {preferenceError && (
          <p className="mt-2 text-center text-sm text-red-400 px-4">
            {preferenceError}
          </p>
        )}

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 w-max">
            {futureWeatherData.map((day, index) => (
              <WeatherCard key={day.date} day={day} isToday={index === 0} unit={unit} />
            ))}
          </div>
        </div>

        {todayData?.astro && (
          <div className="mt-6 flex gap-4">
            <div className="w-1/2">
              <MoonPhaseCard
                className="h-full"
                phase={todayData.astro.moonPhase.phase}
                illumination={todayData.astro.moonPhase.illumination}
                moonrise={todayData.astro.moonrise}
                moonset={todayData.astro.moonset}
                unit={unit}
              />
            </div>

            <div className="w-1/2">
              <WindCard
                className="h-full"
                speed={currentWindSpeed}
                direction={currentWindDirection}
                unit={unit === "us" ? "mph" : "km/h"}
              />
            </div>
          </div>
        )}

        {Object.keys(precipitationMap).length > 0 && (
          <div className="mt-6">
            <PrecipitationChart
              data={precipitationMap}
              unit={unit}
              highlightHour={highlightedPrecipitationHour}
            />
          </div>
        )}
      </div>
    </div>
  );
};

function getConditionFromClouds(cloudCover?: number): string {
  if (cloudCover === undefined) return "Unknown";
  if (cloudCover < 20) return "Clear";
  if (cloudCover < 50) return "Partly Cloudy";
  if (cloudCover < 80) return "Cloudy";
  return "Overcast";
}

function getWeatherIcon(condition: string, isDay: boolean): string {
  switch (condition) {
    case "Clear":
      return isDay ? "☀️" : "🌕";
    case "Partly Cloudy":
      return isDay ? "⛅️" : "🌥️";
    case "Cloudy":
      return "☁️";
    case "Overcast":
      return "🌫️";
    default:
      return "❓";
  }
}

export default WeatherPage;
