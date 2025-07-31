import { WiSunrise, WiSunset } from 'react-icons/wi';


type Props = {
  temperature: number;
  condition: string;
  icon: string;
  sunrise?: string;   // e.g. "05:56:49"
  sunset?: string;   // e.g. "20:32:27"
  unit: 'metric' | 'us';
  onToggle: () => void;
};

const CurrentWeatherCard: React.FC<Props> = ({ temperature, condition, icon, sunrise, sunset, unit, onToggle }) => {

  const fmt = (t?: string) => t ? t.slice(0, 5) : '';


  return (
    <div className="bg-neutral-800 p-6 rounded-xl text-center shadow-lg mb-6">
      <div className="flex justify-end text-xs mb-2">
        <label className="flex items-center gap-1 cursor-pointer">
          <span className={unit === 'metric' ? 'text-cyan-400' : ''}>°C</span>
          <input
            type="checkbox"
            checked={unit === 'us'}
            onChange={onToggle}
            className="form-checkbox h-3 w-3"
          />
          <span className={unit === 'us' ? 'text-cyan-400' : ''}>°F</span>
        </label>
      </div>
      <div className="text-5xl">{icon}</div>
      <div className="text-3xl font-semibold">
        {temperature}°{unit === 'metric' ? 'C' : 'F'}
      </div>
      <div className="text-sm text-gray-400">{condition}</div>

      {/* Sunrise/Sunset row */}
      {(sunrise && sunset) && (
        <div className="mt-4 flex justify-center space-x-8 text-xs text-gray-400">
          <div className="flex items-center">
            <WiSunrise className="w-7 h-7 mr-1" />
            <span>{fmt(sunrise)}</span>
          </div>
          <div className="flex items-center">
            <WiSunset className="w-7 h-7 mr-1" />
            <span>{fmt(sunset)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrentWeatherCard;