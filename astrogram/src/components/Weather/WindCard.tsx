// src/components/Weather/WindCard.tsx
import React from 'react';

export interface WindCardProps {
  speed:     number;
  direction: number;
  unit?:     string;
  className?: string
}

const CARDINALS = ['N','NE','E','SE','S','SW','W','NW'];
function getCardinal(angle: number) {
  const deg = ((angle % 360) + 360) % 360;
  const idx = Math.floor((deg + 22.5) / 45) % 8;
  return CARDINALS[idx];
}

const WindCard: React.FC<WindCardProps> = ({
  speed,
  direction,
  unit = 'km/h',
  className
}) => {
  const cardinal = getCardinal(direction);
  const deg = ((direction % 360) + 360) % 360;

  return (
    <div className={`
        ${className ?? ''} 
        bg-white dark:bg-gray-800 text-black dark:text-white 
        rounded-2xl shadow-md p-4 border border-gray-300 dark:border-gray-700 
        text-center flex flex-col justify-between
      `}>
      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">Wind</h3>

      {/* Arrow + speed */}
      <div className="flex justify-center items-center mb-2">
        <span
          className="inline-block text-4xl"
          style={{ transform: `rotate(${deg}deg)` }}
        >
          ➤
        </span>
        <span className="ml-2 text-2xl font-bold">
          {Math.round(speed)} {unit}
        </span>
      </div>

      {/* Cardinal & degrees */}
      <div className="text-sm text-gray-500">
        {cardinal} &bull; {Math.round(direction)}°
      </div>
    </div>
  );
};

export default WindCard;