import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import ConstellationGame from "../components/Games/ConstellationGame";

const TrueNorthPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-2 py-6 space-y-4">
      {/* Back link */}
      <button
        onClick={() => navigate("/games")}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All Games
      </button>

      {/* Game card shell */}
      <section className="rounded-2xl p-[1px] bg-[conic-gradient(at_20%_10%,rgba(34,211,238,.35),rgba(168,85,247,.28),rgba(16,185,129,.35),rgba(34,211,238,.35))]">
        <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md ring-1 ring-white/10 shadow-[0_8px_28px_rgba(2,6,23,.44)] p-5 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">True North</h2>
              <p className="mt-1 text-sm text-slate-400 max-w-md">
                Constellations appear at random orientations — drag the compass
                needle toward true North and answer as many as you can in 90 seconds.
              </p>
            </div>
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-violet-200 bg-violet-400/10 ring-1 ring-violet-400/30">
              Navigation
            </span>
          </div>

          <ConstellationGame />
        </div>
      </section>
    </div>
  );
};

export default TrueNorthPage;
