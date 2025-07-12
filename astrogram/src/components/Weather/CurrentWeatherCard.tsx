import { Sunrise, Sunset } from 'lucide-react';


type Props = {
  temperature: number;
  condition: string;
  icon: string;
  sunrise?: string;   // e.g. "05:56:49"
  sunset?: string;   // e.g. "20:32:27"
};

const CurrentWeatherCard: React.FC<Props> = ({ temperature, condition, icon, sunrise, sunset }) => {

  const fmt = (t?: string) => t ? t.slice(0, 5) : '';


  return (
    <div className="bg-neutral-800 p-6 rounded-xl text-center shadow-lg mb-6">
      <div className="text-5xl">{icon}</div>
      <div className="text-3xl font-semibold">
        {temperature}°C
      </div>
      <div className="text-sm text-gray-400">{condition}</div>

      {/* Sunrise/Sunset row */}
      {(sunrise && sunset) && (
        <div className="mt-4 flex justify-center space-x-8 text-xs text-gray-400">
          <div className="flex items-center">
            <Sunrise className="w-4 h-4 mr-1" />
            <span>{fmt(sunrise)}</span>
          </div>
          <div className="flex items-center">
            <Sunset className="w-4 h-4 mr-1" />
            <span>{fmt(sunset)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrentWeatherCard;