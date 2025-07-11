import { useMemo } from "react";
import WeatherHeader from "../components/Weather/WeatherHeader";
import CurrentWeatherCard from "../components/Weather/CurrentWeatherCard";
import WeatherCard from "../components/Weather/WeatherCard";
import MoonPhaseCard from "../components/Weather/MoonPhaseCard";
import WeatherSkeleton from "../components/Weather/WeatherSkeleton";

interface WeatherConditions {
  temperature?: Record<string, number>;
  visibility?: Record<string, number>;
  cloudcover?: Record<string, number>;
  humidity?: Record<string, number>;
  precipitation?: Record<string, number>;
  windspeed?: Record<string, number>;
}

export interface AstroData {
  sunrise: string;    // “06:12:34”
  sunset: string;    // “20:03:21”
  moonrise: string;
  moonset: string;
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



interface WeatherData {
  status: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  data: WeatherDay[];
}

interface WeatherPageProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
}

const WeatherPage: React.FC<WeatherPageProps> = ({ weather, loading, error }) => {
  const today = new Date();
  const todayDateStr = today.toDateString();
  const todayStr = today.toISOString().split("T")[0];

  if (loading) return <WeatherSkeleton />;
  if (error) return <div className="text-red-500 text-center py-6">{error}</div>;
  if (!weather || !weather.data) return <div className="text-center text-gray-400 py-6">No weather data available.</div>;

  const todayData = useMemo(
    () => weather.data.find((day) => day.date === todayStr),
    [weather.data, todayStr]
  );

  const futureWeatherData = useMemo(
    () =>

      weather.data.filter(
        (day) => new Date(day.date).setHours(0, 0, 0, 0) >= today.setHours(0, 0, 0, 0)
      ),

    [weather.data, today]
  );

  const currentTemp = todayData?.conditions.temperature?.["12"] ?? 0;
  const currentCondition = getConditionFromClouds(todayData?.conditions.cloudcover?.["12"]);
  const sunrise = todayData?.astro?.sunrise;
  const sunset = todayData?.astro?.sunset;
  console.log(futureWeatherData);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <WeatherHeader
        location={"Oakland, CA"}
        date={today.toLocaleDateString()}
      />

      <CurrentWeatherCard
        temperature={currentTemp}
        condition={currentCondition}
        icon="☀️" // You can update this dynamically later
        sunrise={sunrise}
        sunset={sunset}
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
        <div className="mt-4 flex gap-2">
          <div className="w-1/2">
            <MoonPhaseCard
              phase={todayData.astro.moonPhase.phase}
              illumination={todayData.astro.moonPhase.illumination}
              moonrise={todayData.astro.moonrise}
              moonset={todayData.astro.moonset}
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

export default WeatherPage;