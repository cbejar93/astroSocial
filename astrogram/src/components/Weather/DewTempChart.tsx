import React from 'react';

interface DewTempChartProps {
  temperatures: Record<string, number>;
  dewpoints: Record<string, number>;
}

const DewTempChart: React.FC<DewTempChartProps> = ({ temperatures, dewpoints }) => {
  const times = Object.keys(temperatures)
    .map((t) => parseInt(t, 10))
    .sort((a, b) => a - b)
    .map((t) => t.toString());

  const tempValues = Object.values(temperatures);
  if (tempValues.length === 0) return null;
  const high = Math.max(...tempValues);
  const low = Math.min(...tempValues);

  const q1 = low + (high - low) * 0.25;
  const q2 = low + (high - low) * 0.5;
  const q3 = low + (high - low) * 0.75;

  const width = 300;
  const height = 200;
  const axisX = 40;
  const axisY0 = 10;
  const axisY1 = height - 20;

  const range = high - low || 1;
  const toY = (v: number) => axisY0 + ((high - v) / range) * (axisY1 - axisY0);

  const spacing = (width - axisX - 10) / Math.max(times.length - 1, 1);

  const tempPoints = times
    .map((t, i) => `${axisX + i * spacing},${toY(temperatures[t])}`)
    .join(' ');
  const dewPoints = times
    .map((t, i) => `${axisX + i * spacing},${toY(dewpoints[t])}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="w-full h-48">
      {/* Y Axis */}
      <line x1={axisX} y1={axisY0} x2={axisX} y2={axisY1} stroke="gray" />
      {[high, q3, q2, q1, low].map((val, idx) => (
        <g key={idx}>
          <line
            x1={axisX - 4}
            x2={axisX}
            y1={toY(val)}
            y2={toY(val)}
            stroke="gray"
          />
          <text
            x={axisX - 6}
            y={toY(val)}
            fontSize="10"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {Math.round(val)}
          </text>
        </g>
      ))}

      {/* Temperature line */}
      <polyline
        points={tempPoints}
        fill="none"
        stroke="red"
        strokeWidth="2"
      />

      {/* Dewpoint line */}
      <polyline
        points={dewPoints}
        fill="none"
        stroke="blue"
        strokeWidth="2"
      />

      {/* X labels */}
      {times.map((t, i) => (
        <text
          key={t}
          x={axisX + i * spacing}
          y={axisY1 + 12}
          fontSize="10"
          textAnchor="middle"
        >
          {t}h
        </text>
      ))}
    </svg>
  );
};

export default DewTempChart;
