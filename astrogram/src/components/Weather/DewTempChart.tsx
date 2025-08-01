import React from 'react';

export interface DewTempChartProps {
  temps: Record<string, number>;
  dews: Record<string, number>;
}

const timeBlocks = ['0','3','6','12','18','21'];

const DewTempChart: React.FC<DewTempChartProps> = ({ temps, dews }) => {
  const points = timeBlocks
    .map(t => ({ time: t, temp: temps[t], dew: dews[t] }))
    .filter(p => p.temp !== undefined && p.dew !== undefined);

  if (!points.length) return null;

  const allVals = points.flatMap(p => [p.temp, p.dew]);
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;

  const width = 300;
  const height = 150;
  const xStep = width / (points.length - 1);
  const mapY = (v: number) => height - ((v - min) / range) * height;

  const tempPts = points
    .map((p, i) => `${i * xStep},${mapY(p.temp)}`)
    .join(' ');
  const dewPts = points
    .map((p, i) => `${i * xStep},${mapY(p.dew)}`)
    .join(' ');

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md p-4 border border-gray-300 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-2">Temperature vs Dew Point</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <polyline points={tempPts} fill="none" stroke="#f87171" strokeWidth="2" />
        <polyline points={dewPts} fill="none" stroke="#60a5fa" strokeWidth="2" />
      </svg>
      <div className="flex justify-between text-xs text-gray-400 pt-1">
        {points.map(p => (
          <span key={p.time}>{p.time}h</span>
        ))}
      </div>
      <div className="flex justify-end space-x-4 text-sm mt-2">
        <div className="flex items-center space-x-1">
          <span className="w-4 h-px bg-red-400" />
          <span>Temp</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-4 h-px bg-blue-400" />
          <span>Dew Pt</span>
        </div>
      </div>
    </div>
  );
};

export default DewTempChart;
