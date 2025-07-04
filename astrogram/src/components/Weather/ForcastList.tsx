type ForecastItem = {
    day: string;
    temp: string;
    icon: string;
  };
  
  type Props = {
    forecast: ForecastItem[];
  };
  
  const ForecastList: React.FC<Props> = ({ forecast }) => (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {forecast.map((item, idx) => (
        <div key={idx} className="min-w-[64px] bg-neutral-800 rounded-lg p-2 text-center">
          <div className="text-sm text-gray-400">{item.day}</div>
          <div className="text-xl">{item.icon}</div>
          <div className="text-sm font-semibold">{item.temp}</div>
        </div>
      ))}
    </div>
  );
  
  export default ForecastList;