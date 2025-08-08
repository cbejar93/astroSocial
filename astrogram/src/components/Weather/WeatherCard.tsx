import React from "react";
import type { WeatherDay, TimeBlock } from "../../data/mockWeather";

type WeatherCardProps = {
  day: WeatherDay;
  isToday?: boolean;
};

const levelColors: Record<number, string> = {
  1: "bg-red-600",     // Worst
  2: "bg-orange-500",  // Poor
  3: "bg-yellow-400",  // Moderate
  4: "bg-lime-400",    // Good
  5: "bg-green-500",   // Best
};

const timeBlocks: TimeBlock[] = ["0",'3' ,"6", "12", "18", "21"];
const conditions: Array<keyof WeatherDay["conditions"]> = ["cloudcover", "visibility", "seeing"];

const conditionLabels: Record<string, string> = {
  cloudcover: "Clouds",
  visibility: "Transparancy",
  seeing : "Seeing",
};

function getClosestTimeBlock(): TimeBlock {
  const now = new Date().getHours();
  // convert to numbers & sort just in case
  const blocks = timeBlocks
    .map((tb) => parseInt(tb, 10))
    .sort((a, b) => a - b);

  // find first block >= now
  for (const block of blocks) {
    if (now <= block) {
      return block.toString() as TimeBlock;
    }
  }

  // if we're past the last block, wrap to the first block tomorrow
  return blocks[0].toString() as TimeBlock;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ day, isToday = false }) => {
  const activeTime = isToday ? getClosestTimeBlock() : null;

  return (
    <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-300 dark:border-gray-700 w-full">
      {/* Date Header */}
      <h3 className="text-lg font-semibold px-4 pt-4 pb-2 text-white">
        {new Date(day.date).toLocaleDateString(undefined, {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </h3>

      {/* Grid */}
      <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-x-1 gap-y-2 items-center px-4 pb-4">
        {/* Time headers */}
        <div></div>
        {timeBlocks.map((time) => (
          <div key={time} className={`text-sm text-center ${time === activeTime && isToday ? "text-cyan-400 font-semibold" : "text-gray-400"}`}>
            {time}H
          </div>
        ))}

        {/* Condition rows */}

        {conditions.map((condition) => (
          <React.Fragment key={condition}>
            <div className="capitalize text-sm text-gray-300">
              {conditionLabels[condition] ?? condition}
            </div>            {timeBlocks.map((time) => {
              const rawValue = day.conditions[condition]?.[time];
              const level = mapValueToLevel(condition, rawValue ?? 0);
              const colorClass = levelColors[level] ?? "bg-gray-700";
              const isActive = time === activeTime && isToday;

              return (
                <div
                  key={`${condition}-${time}`}
                  className={`w-6 h-6 mx-auto rounded ${colorClass} ${isActive ? "ring-2 ring-cyan-400" : ""
                    }`}
                  title={`${condition} at ${time}H = ${rawValue ?? "N/A"}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeatherCard;

function mapValueToLevel(condition: string, value: number): number {
  if (value == null || isNaN(value)) return 1;

  switch (condition) {
    case "clouds":
    case "cloudcover":
      // % of sky covered — lower is better
      if (value < 10) return 5;        // Crystal clear
      if (value < 30) return 4;        // Mostly clear
      if (value < 50) return 3;        // Partly cloudy
      if (value < 80) return 2;        // Mostly cloudy
      return 1;                        // Overcast

      case "seeing":
        // boundary layer height in metres — lower is better for astronomical viewing
        if (value <= 100)  return 5;  // Excellent (very stable)
        if (value <= 300)  return 4;  // Great (low mixing)
        if (value <= 600)  return 3;  // Good (moderate mixing)
        if (value <= 1000) return 2;  // Fair (high mixing)
        return 1; 

    case "transparency":
    case "humidity":
    case "relative_humidity_2m":
      // % — lower is better
      if (value < 30) return 5;        // Dry and transparent
      if (value < 45) return 4;        // Good
      if (value < 60) return 3;        // Fair
      if (value < 80) return 2;        // Humid
      return 1;                        // Very humid / poor transparency

    case "visibility":
      // meters — higher is better
      if (value >= 25000) return 5;    // Crystal clear
      if (value >= 20000) return 4;    // Excellent
      if (value >= 15000) return 3;    // Good
      if (value >= 8000) return 2;     // Fair
      return 1;                        // Poor

    case "precipitation":
    case "precipitation_probability":
      // % — lower is better
      if (value < 5) return 5;         // Dry
      if (value < 15) return 4;        // Slight chance
      if (value < 30) return 3;        // Moderate risk
      if (value < 60) return 2;        // High chance
      return 1;                        // Very likely

    default:
      return 1;
  }
}

