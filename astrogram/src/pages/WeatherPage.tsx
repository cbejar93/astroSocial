import { useMemo } from "react";
import WeatherHeader from "../components/Weather/WeatherHeader";
import CurrentWeatherCard from "../components/Weather/CurrentWeatherCard";
import WeatherCard from "../components/Weather/WeatherCard";
import MoonPhaseCard from "../components/Weather/MoonPhaseCard";
import WeatherSkeleton from "../components/Weather/WeatherSkeleton";
import WindCard from "../components/Weather/WindCard";

interface WeatherConditions {
  temperature?: Record<string, number>;
  dewpoint?: Record<string, number>;
  visibility?: Record<string, number>;
  cloudcover?: Record<string, number>;
  humidity?: Record<string, number>;
  precipitation?: Record<string, number>;
  windspeed?: Record<string, number>;
  winddirection?: Record<string, number>;
  seeing?:Record<string, number>
}

export interface AstroData {
  sunrise: string;    // “06:12:34”
  sunset: string;    // “20:03:21”
  moonrise?: string;
  moonset?: string;
  moonPhase: {
    phase: string;        // e.g. “Full Moon”
    illumination: number; // percent 0–100
  };
}

export interface WeatherDay {
  date: string;         // “2025-07-11”
  conditions: WeatherConditions;
  astro?: AstroData;
}



export interface WeatherData {
  status: string;
  coordinates: string;
  data: WeatherDay[];
}

interface WeatherPageProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  unit: 'metric' | 'us';
  setUnit: (u: 'metric' | 'us') => void;
}

const WeatherPage: React.FC<WeatherPageProps> = ({ weather, loading, error, unit, setUnit }) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().split("T")[0];
  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayData = useMemo(
    () => (weather?.data ?? []).find((day) => day.date === todayStr),
    [weather, todayStr]
  );

  const futureWeatherData = useMemo(
    () =>
      (weather?.data ?? []).filter(
        (day) => new Date(day.date).setHours(0, 0, 0, 0) >= todayMidnight
      ),
    [weather, todayMidnight]
  );

  if (loading) return <WeatherSkeleton />;
  if (error) return <div className="text-red-500 text-center py-6">{error}</div>;
  if (!weather || !weather.data)
    return <div className="text-center text-gray-400 py-6">No weather data available.</div>;

  // const currentTemp = todayData?.conditions.temperature?.["12"] ?? 0;
  // const currentCondition = getConditionFromClouds(todayData?.conditions.cloudcover?.["12"]);
  const sunrise = todayData?.astro?.sunrise;
  const sunset = todayData?.astro?.sunset;

  const isDaytime = todayData?.astro
    ? checkDaytime(todayData.astro.sunrise, todayData.astro.sunset)
    : true;


  const speedMap = todayData?.conditions.windspeed ?? {};
  const directionMap = todayData?.conditions.winddirection ?? {};
  const tempMap = todayData?.conditions.temperature ?? {};
  const conditionMap = todayData?.conditions.cloudcover ?? {};

  // 2) turn the keys into numbers and find which hour is closest to now
  const nowHour = new Date().getHours();
  const available = Object.keys(speedMap).map(h => parseInt(h, 10));
  // fallback if no data
  let chosenHour = available.length ? available[0] : 0;

  if (available.length) {
    chosenHour = available.reduce((prev, curr) => {
      return Math.abs(curr - nowHour) < Math.abs(prev - nowHour) ? curr : prev;
    }, available[0]);
  }

  // 3) pull out the values for that hour
  const currentWindSpeed = speedMap[chosenHour];
  const currentWindDirection = directionMap[chosenHour];
  const currentTemp = tempMap[chosenHour];
  const currentCondition = getConditionFromClouds(conditionMap[chosenHour]);

  const icon = getWeatherIcon(currentCondition, isDaytime);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <WeatherHeader
        location={weather.coordinates}
        date={today.toLocaleDateString()}
      />

      <CurrentWeatherCard
        temperature={currentTemp}
        condition={currentCondition}
        icon={icon} // You can update this dynamically later
        sunrise={sunrise}
        sunset={sunset}
        unit={unit}
        onToggle={() => setUnit(unit === 'metric' ? 'us' : 'metric')}
      />

      {/* Forecast Cards */}
      <div className="overflow-x-auto px-0 sm:px-4 pb-4">
        <div className="flex gap-3 w-max">
          {futureWeatherData.map((day, index) => (
            <WeatherCard key={day.date} day={day} isToday={index === 0} />
          ))}
        </div>
      </div>

      {/* Moon Phase */}
      {todayData?.astro && (
        <div className="mt-6 flex gap-4">
          {/* Moon card at half-width */}
          <div className="w-1/2">
            <MoonPhaseCard
             className="h-full"
              phase={todayData.astro.moonPhase.phase}
              illumination={todayData.astro.moonPhase.illumination}
              moonrise={todayData.astro.moonrise}
              moonset={todayData.astro.moonset}
            />
          </div>

          {/* Wind card at half-width */}
          <div className="w-1/2">
            <WindCard
              className="h-full"
              speed={currentWindSpeed}
              direction={currentWindDirection}
              unit="km/h"
            />
          </div>
        </div>
      )}
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
    case 'Clear':
      return isDay ? '☀️' : '🌕';
    case 'Partly Cloudy':
      return isDay ? '⛅️' : '🌥️';
    case 'Cloudy':
      return '☁️';
    case 'Overcast':
      return '🌫️';
    default:
      return '❓';
  }
}

function checkDaytime(sunrise: string, sunset: string): boolean {
  const now = new Date();
  // parse “HH:MM:SS” to a Date for today
  const [srH, srM] = sunrise.split(':').map(Number);
  const [ssH, ssM] = sunset.split(':').map(Number);
  const sr = new Date(now); sr.setHours(srH, srM, 0, 0);
  const ss = new Date(now); ss.setHours(ssH, ssM, 0, 0);
  return now >= sr && now < ss;
}

export default WeatherPage;