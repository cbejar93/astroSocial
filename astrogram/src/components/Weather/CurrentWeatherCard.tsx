type Props = {
    temperature: string;
    condition: string;
    icon: string;
  };
  
  const CurrentWeatherCard: React.FC<Props> = ({ temperature, condition, icon }) => (
    <div className="bg-neutral-800 p-6 rounded-xl text-center shadow-lg mb-6">
      <div className="text-5xl">{icon}</div>
      <div className="text-3xl font-semibold">{temperature}</div>
      <div className="text-sm text-gray-400">{condition}</div>
    </div>
  );
  
  export default CurrentWeatherCard;