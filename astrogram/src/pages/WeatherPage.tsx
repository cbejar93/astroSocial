import WeatherHeader from "../components/Weather/WeatherHeader"
import CurrentWeatherCard from "../components/Weather/CurrentWeatherCard";
import { mockCurrentWeather, mockWeatherData } from "../data/mockWeather";
import WeatherCard from "../components/Weather/WeatherCard";
import { useMemo } from "react";
import MoonPhaseCard from '../components/Weather/MoonPhaseCard';



const WeatherPage: React.FC = () => {
  const today = new Date().toDateString();

  const todayData = useMemo(() => {
    return mockWeatherData.find(
      (day) => new Date(day.date).toDateString() === today
    );
  }, [today]);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">

      <WeatherHeader location={mockCurrentWeather.location} date={mockCurrentWeather.date} />
      <CurrentWeatherCard
        temperature={mockCurrentWeather.temperature}
        condition={mockCurrentWeather.condition}
        icon={mockCurrentWeather.icon}
      />
      <div className="overflow-x-auto px-0 sm:px-4 pb-4">
        <div className="flex gap-3 w-max">
          {mockWeatherData.map((day) => (
            <WeatherCard key={day.date} day={day} />
          ))}
        </div>
      </div>
      {/* Only show today's moon phase below weather cards */}
      {todayData?.moonPhase && (
        <div className="mt-4 flex flex-row gap-2 px-4 sm:px-4">
          <div className="w-1/2">
            <MoonPhaseCard
              phase={todayData.moonPhase.phase}
              illumination={todayData.moonPhase.illumination}
            />
          </div>
          <div className="w-1/2">
            <MoonPhaseCard
              phase="Waxing Gibbous" // mock data
              illumination={0.73}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default WeatherPage;