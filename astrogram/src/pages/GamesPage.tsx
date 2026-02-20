import React from "react";
import ConstellationGame from "../components/Games/ConstellationGame";

const GamesPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-2xl px-2 py-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Star Games</h1>
        <p className="mt-1 text-sm text-slate-400">
          Test your astronomical navigation skills.
        </p>
      </div>

      {/* True North game card */}
      <section className="rounded-2xl p-[1px] bg-[conic-gradient(at_20%_10%,rgba(34,211,238,.35),rgba(168,85,247,.28),rgba(16,185,129,.35),rgba(34,211,238,.35))]">
        <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md ring-1 ring-white/10 shadow-[0_8px_28px_rgba(2,6,23,.44)] p-5 space-y-6">
          {/* Game header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">True North</h2>
              <p className="mt-1 text-sm text-slate-400 max-w-md">
                A constellation is shown at a random orientation. Rotate the compass
                needle to point toward true North, then submit your answer.
              </p>
            </div>
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-violet-200 bg-violet-400/10 ring-1 ring-violet-400/30">
              Navigation
            </span>
          </div>

          {/* Game */}
          <ConstellationGame />
        </div>
      </section>
    </div>
  );
};

export default GamesPage;
