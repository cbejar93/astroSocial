type Props = {
    location: string;
    date: string;
  };
  
  const WeatherHeader: React.FC<Props> = ({ location, date }) => (
    <div className="mb-4 text-center">
      <h1 className="text-2xl font-bold">{location}</h1>
      <p className="text-sm text-gray-400">{date}</p>
    </div>
  );
  
  export default WeatherHeader;