const WeatherSkeleton = () => {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto animate-pulse space-y-6">
        {/* Header Skeleton */}
        <div className="h-6 bg-gray-700 rounded w-1/3"></div>
  
        {/* Current Weather Card Skeleton */}
        <div className="h-32 bg-gray-800 rounded-lg"></div>
  
        {/* Forecast Cards Skeleton */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 w-max">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-40 h-32 bg-gray-800 rounded-md flex-shrink-0"
              ></div>
            ))}
          </div>
        </div>
  
        {/* Moon Phase Skeleton */}
        <div className="flex gap-2">
          <div className="w-1/2 h-28 bg-gray-800 rounded-md"></div>
          <div className="w-1/2 h-28 bg-gray-800 rounded-md"></div>
        </div>
      </div>
    );
  };
  
  export default WeatherSkeleton;