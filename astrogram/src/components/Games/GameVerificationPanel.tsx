import React, { useState } from 'react';
import { ChevronLeft, Navigation, Trash2, RotateCcw } from 'lucide-react';
import { CONSTELLATIONS, type Constellation } from '../../data/constellations';
import ConstellationPreview from './ConstellationPreview';

const STORAGE_KEY = 'admin:deleted-constellations';

function loadDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDeletedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

const GameVerificationPanel: React.FC = () => {
  const [selected, setSelected] = useState<Constellation | null>(null);
  const [rotation, setRotation] = useState(0);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(loadDeletedIds);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const trueNorth = (360 - rotation) % 360;

  function handleDelete(id: string) {
    const next = new Set(deletedIds).add(id);
    setDeletedIds(next);
    saveDeletedIds(next);
    setSelected(null);
    setRotation(0);
    setConfirmDelete(false);
  }

  function handleRestore(id: string) {
    const next = new Set(deletedIds);
    next.delete(id);
    setDeletedIds(next);
    saveDeletedIds(next);
  }

  function handleResetAll() {
    const empty = new Set<string>();
    setDeletedIds(empty);
    saveDeletedIds(empty);
  }

  const activeConstellations = CONSTELLATIONS.filter((c) => !deletedIds.has(c.id));
  const removedConstellations = CONSTELLATIONS.filter((c) => deletedIds.has(c.id));

  if (selected) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { setSelected(null); setRotation(0); setConfirmDelete(false); }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            All Constellations
          </button>

          {/* Delete / confirm */}
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-300">Remove this constellation?</span>
              <button
                type="button"
                onClick={() => handleDelete(selected.id)}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Yes, remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded border border-gray-600 text-gray-300 hover:text-white text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/70 text-xs font-medium transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">True North — Constellation Verification</h2>
          <p className="text-sm text-gray-400 mt-1">
            Click any constellation to inspect its star positions, lines, and navigation tip.
            All diagrams shown at canonical orientation (North = up).
          </p>
        </div>
        {removedConstellations.length > 0 && (
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-xs transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore all ({removedConstellations.length})
          </button>
        )}
      </div>

      {activeConstellations.length === 0 ? (
        <p className="text-sm text-gray-500 italic">All constellations have been removed.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {activeConstellations.map((c) => (
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
      )}

      {/* Removed constellations */}
      {removedConstellations.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-gray-500">
            Removed ({removedConstellations.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {removedConstellations.map((c) => (
              <div
                key={c.id}
                className="flex flex-col items-center rounded-xl border border-gray-800 bg-gray-900/30 p-3 opacity-50"
              >
                <ConstellationPreview
                  constellation={c}
                  size={160}
                  className="rounded-lg w-full h-auto"
                />
                <div className="mt-2 w-full">
                  <div className="text-sm font-medium text-gray-400 leading-tight truncate">
                    {c.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(c.id)}
                    className="flex items-center gap-1 mt-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameVerificationPanel;
