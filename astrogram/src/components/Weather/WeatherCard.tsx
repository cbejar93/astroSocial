import React from "react";
import type { WeatherDay, TimeBlock } from "../../data/mockWeather";

type WeatherCardProps = {
  day: WeatherDay;
  isToday?: boolean;
};

const levelColors: Record<number, string> = {
  1: "bg-gray-500",
  2: "bg-yellow-500",
  3: "bg-lime-500",
  4: "bg-green-500",
};

const timeBlocks: TimeBlock[] = ["0", "6", "12", "18"];
const conditions: Array<keyof WeatherDay["conditions"]> = ["clouds", "seeing", "transparency"];

const getClosestTimeBlock = (): TimeBlock => {
  const currentHour = new Date().getHours();
  if (currentHour < 3) return "0";
  if (currentHour < 9) return "6";
  if (currentHour < 15) return "12";
  return "18";
};

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
      <div className="grid grid-cols-[100px_repeat(4,1fr)] gap-x-1 gap-y-2 items-center px-4 pb-4">
        {/* Time headers */}
        <div></div>
        {timeBlocks.map((time) => (
          <div key={time} className={`text-sm text-center ${time === activeTime && isToday ? "text-cyan-400 font-semibold" : "text-gray-400"}`}>
            {time}:00
          </div>
        ))}

        {/* Condition rows */}
        {conditions.map((condition) => (
          <React.Fragment key={condition}>
            <div className="capitalize text-sm text-gray-300">{condition}</div>
            {timeBlocks.map((time) => {
              const value = day.conditions[condition][time];
              const colorClass = levelColors[value] ?? "bg-gray-700";
              const isActive = time === activeTime && isToday;

              return (
                <div
                  key={`${condition}-${time}`}
                  className={`w-6 h-6 mx-auto rounded ${colorClass} ${isActive ? "ring-2 ring-cyan-400" : ""}`}
                  title={`${condition} at ${time}:00 = ${value}`}
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
