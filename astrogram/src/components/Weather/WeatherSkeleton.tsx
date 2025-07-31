const WeatherSkeleton = () => {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center mb-4">
        <div className="h-6 w-2/3 mx-auto bg-gray-700 rounded mb-1" />
        <div className="h-4 w-1/3 mx-auto bg-gray-700 rounded" />
      </div>

      {/* Current Weather Card Skeleton */}
      <div className="bg-neutral-800 p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex justify-end">
          <div className="h-4 w-12 bg-gray-700 rounded" />
        </div>
        <div className="h-10 w-16 bg-gray-700 rounded-full mx-auto" />
        <div className="h-6 w-20 bg-gray-700 rounded mx-auto" />
        <div className="h-4 w-24 bg-gray-700 rounded mx-auto" />
      </div>

      {/* Forecast Cards Skeleton */}
      <div className="overflow-x-auto px-0 sm:px-4 pb-4">
        <div className="flex gap-3 w-max">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-40 h-52 bg-gray-800 rounded-2xl border border-gray-700 flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Moon & Wind Skeleton */}
      <div className="mt-6 flex gap-4">
        <div className="w-1/2 h-44 bg-gray-800 rounded-2xl border border-gray-700" />
        <div className="w-1/2 h-44 bg-gray-800 rounded-2xl border border-gray-700" />
      </div>
    </div>
  );
};

export default WeatherSkeleton;
