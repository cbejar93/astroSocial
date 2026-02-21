import React from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { canAnonPlayToday } from "../lib/anonGameUtils";

interface GameCard {
  id: string;
  route: string;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  gradient: string;
}

const GAME_CARDS: GameCard[] = [
  {
    id: "true-north",
    route: "/games/true-north",
    title: "True North",
    tagline: "90-second constellation blitz",
    description:
      "A constellation is shown at a random orientation. Rotate the compass needle to point toward true North and rack up as many correct answers as you can before time runs out.",
    badge: "Navigation",
    icon: <Compass className="h-8 w-8" />,
    gradient: "from-cyan-500/20 via-violet-500/20 to-emerald-500/20",
  },
];

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Star Games</h1>
        <p className="mt-1 text-sm text-slate-400">
          Test your astronomical skills against the cosmos — and each other.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {GAME_CARDS.map((card) => {
          const isAnon = !user;
          const blocked = isAnon && !canAnonPlayToday(card.id);

          return (
            <div
              key={card.id}
              className="rounded-2xl p-[1px] bg-[conic-gradient(at_20%_10%,rgba(34,211,238,.3),rgba(168,85,247,.25),rgba(16,185,129,.3),rgba(34,211,238,.3))]"
            >
              <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md h-full flex flex-col p-5 gap-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`rounded-xl p-3 bg-gradient-to-br ${card.gradient} ring-1 ring-white/10 text-slate-200`}
                  >
                    {card.icon}
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-violet-200 bg-violet-400/10 ring-1 ring-violet-400/30">
                    {card.badge}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 space-y-1">
                  <h2 className="text-lg font-semibold text-slate-100">
                    {card.title}
                  </h2>
                  <p className="text-xs font-medium text-cyan-400">
                    {card.tagline}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed pt-1">
                    {card.description}
                  </p>
                </div>

                {/* Anonymous daily limit notice */}
                {isAnon && (
                  <p className="text-xs text-slate-500">
                    {blocked
                      ? "You've used your free play for today. Sign up to play unlimited!"
                      : "Guest players get 1 free play per day. Sign up for unlimited."}
                  </p>
                )}

                {/* CTA */}
                <button
                  onClick={() => !blocked && navigate(card.route)}
                  disabled={blocked}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
                    blocked
                      ? "opacity-40 cursor-not-allowed bg-slate-700"
                      : "hover:brightness-110 active:scale-95"
                  }`}
                  style={
                    blocked
                      ? undefined
                      : { background: "linear-gradient(90deg, #0ea5e9, #a855f7)" }
                  }
                >
                  {blocked ? (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      Come back tomorrow
                    </span>
                  ) : (
                    "Play Now"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GamesPage;
