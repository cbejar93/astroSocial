import WeatherHeader from "../components/Weather/WeatherHeader";
import CurrentWeatherCard from "../components/Weather/CurrentWeatherCard";
import { mockCurrentWeather, mockWeatherData } from "../data/mockWeather";
import WeatherCard from "../components/Weather/WeatherCard";
import { useMemo } from "react";
import MoonPhaseCard from "../components/Weather/MoonPhaseCard";

const WeatherPage: React.FC = () => {
  const today = new Date();
  const todayDateStr = today.toDateString();

  // Get today's weather data
  const todayData = useMemo(() => {
    return mockWeatherData.find(
      (day) => new Date(day.date).toDateString() === todayDateStr
    );
  }, [todayDateStr]);

  // Only include today and future days
  const futureWeatherData = useMemo(() => {
    return mockWeatherData.filter(
      (day) => new Date(day.date).setHours(0, 0, 0, 0) >= today.setHours(0, 0, 0, 0)
    );
  }, [today]);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <WeatherHeader
        location={mockCurrentWeather.location}
        date={mockCurrentWeather.date}
      />
      <CurrentWeatherCard
        temperature={mockCurrentWeather.temperature}
        condition={mockCurrentWeather.condition}
        icon={mockCurrentWeather.icon}
      />

      {/* Forecast Cards */}
      <div className="overflow-x-auto px-0 sm:px-4 pb-4">
        <div className="flex gap-3 w-max">
          {futureWeatherData.map((day, index) => (
            <WeatherCard key={day.date} day={day} isToday={index === 0} />
          ))}
        </div>
      </div>

      {/* Moon Phase for today */}
      {todayData?.moonPhase && (
        <div className="mt-4 flex gap-2">
          <div className="w-1/2">
            <MoonPhaseCard
              phase={todayData.moonPhase.phase}
              illumination={todayData.moonPhase.illumination}
            />
          </div>
          <div className="w-1/2">
            <MoonPhaseCard
              phase="Waxing Gibbous" // mock fallback
              illumination={0.73}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherPage;
