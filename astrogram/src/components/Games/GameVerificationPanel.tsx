import React, { useState } from 'react';
import { ChevronLeft, Navigation } from 'lucide-react';
import { CONSTELLATIONS, type Constellation } from '../../data/constellations';
import ConstellationPreview from './ConstellationPreview';

const GameVerificationPanel: React.FC = () => {
  const [selected, setSelected] = useState<Constellation | null>(null);
  const [rotation, setRotation] = useState(0);

  const trueNorth = (360 - rotation) % 360;

  if (selected) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => { setSelected(null); setRotation(0); }}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          All Constellations
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: canvas + controls */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <ConstellationPreview
              constellation={selected}
              rotation={rotation}
              size={400}
              showNorthArrow
              showAllNames
              className="rounded-2xl ring-1 ring-white/10 shadow-[0_8px_32px_rgba(2,6,23,0.6)] block"
            />

            {/* Rotation slider */}
            <div className="w-full max-w-[400px] space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Rotation: <span className="text-white font-semibold">{rotation}°</span></span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  True North: <span className="text-white font-semibold ml-1">{trueNorth}°</span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={359}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>0°</span>
                <span>90°</span>
                <span>180°</span>
                <span>270°</span>
                <span>359°</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 bg-emerald-400" />
                True North arrow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 bg-sky-400/60" />
                Constellation lines
              </span>
            </div>
          </div>

          {/* Right: metadata */}
          <div className="flex-1 space-y-5 min-w-0">
            <div>
              <h2 className="text-xl font-bold text-white">{selected.name}</h2>
              <span className="inline-block mt-1 rounded bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-400 border border-gray-700">
                {selected.id}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
            </div>

            {/* Navigation tip */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-2">
                <Navigation className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-emerald-400 mb-1">Navigation Tip</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{selected.navigationTip}</p>
                </div>
              </div>
            </div>

            {/* Stars table */}
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-2">
                Stars ({selected.stars.length})
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-700">
                <table className="min-w-full text-xs divide-y divide-gray-800">
                  <thead className="bg-gray-800/60 text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-right font-medium">x</th>
                      <th className="px-3 py-2 text-right font-medium">y</th>
                      <th className="px-3 py-2 text-right font-medium">Mag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-gray-900/40">
                    {selected.stars.map((star, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-500">{i}</td>
                        <td className="px-3 py-2 text-gray-200 font-medium">
                          {star.name ?? <span className="text-gray-600 italic">unnamed</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-400">
                          {star.x.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-400">
                          {star.y.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={
                              star.magnitude <= 1.5
                                ? 'text-amber-300 font-semibold'
                                : star.magnitude <= 2.5
                                  ? 'text-gray-200'
                                  : 'text-gray-500'
                            }
                          >
                            {star.magnitude.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lines table */}
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-2">
                Lines ({selected.lines.length})
              </h3>
              <div className="overflow-hidden rounded-lg border border-gray-700">
                <table className="min-w-full text-xs divide-y divide-gray-800">
                  <thead className="bg-gray-800/60 text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">From</th>
                      <th className="px-3 py-2 text-left font-medium">To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-gray-900/40">
                    {selected.lines.map((line, i) => {
                      const fromStar = selected.stars[line.from];
                      const toStar = selected.stars[line.to];
                      return (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                          <td className="px-3 py-2 text-gray-300">
                            <span className="text-gray-500 mr-1">{line.from}</span>
                            {fromStar.name ?? ''}
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            <span className="text-gray-500 mr-1">{line.to}</span>
                            {toStar.name ?? ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">True North — Constellation Verification</h2>
        <p className="text-sm text-gray-400 mt-1">
          Click any constellation to inspect its star positions, lines, and navigation tip.
          All diagrams shown at canonical orientation (North = up).
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {CONSTELLATIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => { setSelected(c); setRotation(0); }}
            className="group flex flex-col items-center rounded-xl border border-gray-700 bg-gray-900/50 p-3 hover:border-violet-500/50 hover:bg-gray-800/60 transition-all text-left"
          >
            <ConstellationPreview
              constellation={c}
              size={160}
              className="rounded-lg w-full h-auto"
            />
            <div className="mt-2 w-full">
              <div className="text-sm font-medium text-gray-200 group-hover:text-white leading-tight truncate">
                {c.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {c.stars.length} stars · {c.lines.length} lines
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameVerificationPanel;
