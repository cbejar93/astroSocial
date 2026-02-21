import React, { useCallback, useEffect, useRef, useState } from "react";
import { CONSTELLATIONS, type Constellation } from "../../data/constellations";
import { Compass, SkipForward, Trophy, Clock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  getAnonName,
  canAnonPlayToday,
  markAnonPlayedToday,
} from "../../lib/anonGameUtils";
import {
  submitGameScore,
  fetchGameLeaderboard,
  type LeaderboardEntry,
} from "../../lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const GAME_ID       = "true-north";
const GAME_DURATION = 90; // seconds
const TRANSITION_MS = 650; // ms of feedback flash between rounds

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[], exclude?: T): T {
  const pool = exclude ? arr.filter((x) => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function angleError(a: number, b: number): number {
  const diff = ((a - b + 540) % 360) - 180;
  return Math.abs(diff);
}

function calcScore(errorDeg: number): number {
  return Math.max(0, Math.round(100 - (errorDeg / 90) * 100));
}

// ─── Canvas drawing ──────────────────────────────────────────────────────────

function drawScene(
  canvas: HTMLCanvasElement,
  constellation: Constellation,
  rotationDeg: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const scale = Math.min(W, H) * 0.38;

  ctx.fillStyle = "#060a18";
  ctx.fillRect(0, 0, W, H);

  // Seeded background stars
  const rand = mulberry32(
    constellation.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  );
  for (let i = 0; i < 160; i++) {
    const bx = rand() * W, by = rand() * H;
    const br = rand() * 1.2 + 0.2;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${rand() * 0.5 + 0.1})`;
    ctx.fill();
  }

  const rotRad = (rotationDeg * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotRad);

  const project = (x: number, y: number) => ({ px: x * scale, py: -y * scale });

  // Lines
  ctx.strokeStyle = "rgba(99,179,237,0.45)";
  ctx.lineWidth = 1.5;
  for (const line of constellation.lines) {
    const a = constellation.stars[line.from];
    const b = constellation.stars[line.to];
    const { px: ax, py: ay } = project(a.x, a.y);
    const { px: bx, py: by } = project(b.x, b.y);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  // Stars + labels (counter-rotated to stay right-side up)
  for (const star of constellation.stars) {
    const { px, py } = project(star.x, star.y);
    const r = Math.max(1.5, 5.5 - star.magnitude * 0.7);
    const grd = ctx.createRadialGradient(px, py, 0, px, py, r * 2.5);
    grd.addColorStop(0, "rgba(255,255,255,0.95)");
    grd.addColorStop(0.4, "rgba(200,235,255,0.6)");
    grd.addColorStop(1, "rgba(120,180,255,0)");
    ctx.beginPath();
    ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();

    if (star.name && star.magnitude <= 2.5) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-rotRad); // keep label upright
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "rgba(180,220,255,0.75)";
      ctx.fillText(star.name, r + 3, 4);
      ctx.restore();
    }
  }

  ctx.restore();

  // Crosshair
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12);
  ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy);
  ctx.stroke();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GamePhase = "lobby" | "countdown" | "playing" | "transitioning" | "finished";

interface RoundResult {
  constellationId: string;
  constellationName: string;
  score: number;
  accuracy: number; // degrees off
  skipped: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ConstellationGame: React.FC = () => {
  const { user } = useAuth();
  const isAnon = !user;

  // ── Canvas ────────────────────────────────────────────────────────────────
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(400);

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setCanvasSize(Math.min(containerRef.current.clientWidth, 520));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Game state ────────────────────────────────────────────────────────────
  const [phase, setPhase]               = useState<GamePhase>("lobby");
  const [countdownCount, setCountdownCount] = useState(3);
  const [timeLeft, setTimeLeft]         = useState(GAME_DURATION);
  const [results, setResults]           = useState<RoundResult[]>([]);
  const [lastResult, setLastResult]     = useState<RoundResult | null>(null);
  const [constellation, setConstellation] = useState<Constellation>(() =>
    pickRandom(CONSTELLATIONS)
  );
  const [rotation, setRotation]         = useState(() => Math.floor(Math.random() * 360));
  const [needleAngle, setNeedleAngle]   = useState(0);
  const dragging                        = useRef(false);

  // Leaderboard
  const [leaderboard, setLeaderboard]   = useState<LeaderboardEntry[]>([]);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [displayName, setDisplayName]   = useState(() =>
    isAnon ? getAnonName() : (user?.username ?? "")
  );

  // Mutable refs to avoid stale closures in timer/submit
  const phaseRef         = useRef<GamePhase>("lobby");
  const needleAngleRef   = useRef(0);
  const rotationRef      = useRef(rotation);
  const constellationRef = useRef(constellation);
  const resultsRef       = useRef<RoundResult[]>([]);
  const usedIdsRef       = useRef<Set<string>>(new Set());
  const gameStartRef     = useRef(0);

  phaseRef.current         = phase;
  needleAngleRef.current   = needleAngle;
  rotationRef.current      = rotation;
  constellationRef.current = constellation;

  // ── Canvas draw ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = canvasSize;
    canvas.height = canvasSize;
    drawScene(canvas, constellation, rotation);
  }, [constellation, rotation, canvasSize]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdownCount <= 0) {
      gameStartRef.current = Date.now();
      setPhase("playing");
      return;
    }
    const id = setTimeout(() => setCountdownCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdownCount]);

  // ── Wall-clock timer (runs during playing + transitioning) ────────────────
  useEffect(() => {
    if (phase !== "playing" && phase !== "transitioning") return;

    const id = setInterval(() => {
      const elapsed = (Date.now() - gameStartRef.current) / 1000;
      const remaining = GAME_DURATION - elapsed;

      if (remaining <= 0) {
        clearInterval(id);
        setTimeLeft(0);
        if (phaseRef.current === "playing") {
          // Auto-submit current constellation
          const trueNorth = (360 - rotationRef.current) % 360;
          const err = angleError(needleAngleRef.current, trueNorth);
          const s = calcScore(err);
          const final: RoundResult = {
            constellationId: constellationRef.current.id,
            constellationName: constellationRef.current.name,
            score: s,
            accuracy: Math.round(err),
            skipped: false,
          };
          resultsRef.current = [...resultsRef.current, final];
          setResults([...resultsRef.current]);
        }
        setPhase("finished");
      } else {
        setTimeLeft(Math.ceil(remaining));
      }
    }, 200);

    return () => clearInterval(id);
  }, [phase]);

  // ── Submit a round ────────────────────────────────────────────────────────
  const submitRound = useCallback((skip = false) => {
    if (phaseRef.current !== "playing") return;

    const trueNorth = (360 - rotationRef.current) % 360;
    const err  = skip ? 90 : angleError(needleAngleRef.current, trueNorth);
    const s    = skip ? 0 : calcScore(err);
    const result: RoundResult = {
      constellationId:   constellationRef.current.id,
      constellationName: constellationRef.current.name,
      score:    s,
      accuracy: Math.round(err),
      skipped:  skip,
    };

    resultsRef.current = [...resultsRef.current, result];
    setResults([...resultsRef.current]);
    setLastResult(result);
    setPhase("transitioning");

    setTimeout(() => {
      // If time ran out during the transition, finish game
      const elapsed = (Date.now() - gameStartRef.current) / 1000;
      if (elapsed >= GAME_DURATION || phaseRef.current === "finished") {
        setPhase("finished");
        return;
      }

      // Pick next unseen constellation
      usedIdsRef.current.add(constellationRef.current.id);
      const available = CONSTELLATIONS.filter(
        (c) => !usedIdsRef.current.has(c.id)
      );
      const next =
        available.length > 0
          ? pickRandom(available)
          : pickRandom(CONSTELLATIONS);

      setConstellation(next);
      setRotation(Math.floor(Math.random() * 360));
      setNeedleAngle(0);
      setPhase("playing");
    }, TRANSITION_MS);
  }, []);

  // ── Compass drag ──────────────────────────────────────────────────────────
  const getAngleFromCenter = useCallback(
    (clientX: number, clientY: number): number => {
      const canvas = canvasRef.current;
      if (!canvas) return 0;
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rad = Math.atan2(clientX - cx, -(clientY - cy));
      return ((rad * 180) / Math.PI + 360) % 360;
    },
    []
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (phase !== "playing") return;
      dragging.current = true;
      setNeedleAngle(getAngleFromCenter(e.clientX, e.clientY));
    },
    [phase, getAngleFromCenter]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (phase !== "playing") return;
      dragging.current = true;
      const t = e.touches[0];
      setNeedleAngle(getAngleFromCenter(t.clientX, t.clientY));
    },
    [phase, getAngleFromCenter]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setNeedleAngle(getAngleFromCenter(e.clientX, e.clientY));
    };
    const onUp = () => { dragging.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      setNeedleAngle(getAngleFromCenter(e.touches[0].clientX, e.touches[0].clientY));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [getAngleFromCenter]);

  // ── Fetch leaderboard on finished ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "finished") return;
    if (isAnon) markAnonPlayedToday(GAME_ID);
    fetchGameLeaderboard(GAME_ID)
      .then(setLeaderboard)
      .catch(() => { /* silently ignore offline */ });
  }, [phase, isAnon]);

  // ── Submit score to backend ───────────────────────────────────────────────
  const handleSubmitScore = async () => {
    if (scoreSubmitted || results.length === 0) return;
    setSubmitting(true);
    try {
      const total      = results.reduce((s, r) => s + r.score, 0);
      const answered   = results.filter((r) => !r.skipped);
      const avgAccuracy = answered.length
        ? answered.reduce((s, r) => s + r.accuracy, 0) / answered.length
        : 90;

      await submitGameScore({
        gameId:      GAME_ID,
        displayName: displayName.trim() || (isAnon ? getAnonName() : (user?.username ?? "Player")),
        score:       total,
        rounds:      results.length,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      });
      setScoreSubmitted(true);
      const updated = await fetchGameLeaderboard(GAME_ID);
      setLeaderboard(updated);
    } catch {
      // fail silently; player still sees results
    } finally {
      setSubmitting(false);
    }
  };

  // ── Start a new game ──────────────────────────────────────────────────────
  const handleStartGame = () => {
    const first = pickRandom(CONSTELLATIONS);
    setConstellation(first);
    setRotation(Math.floor(Math.random() * 360));
    setNeedleAngle(0);
    setResults([]);
    resultsRef.current = [];
    usedIdsRef.current = new Set();
    setLastResult(null);
    setTimeLeft(GAME_DURATION);
    setScoreSubmitted(false);
    setCountdownCount(3);
    setPhase("countdown");
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const needleLen      = canvasSize * 0.38;
  const trueNorthAngle = (360 - rotation) % 360;
  const totalScore     = results.reduce((s, r) => s + r.score, 0);
  const answered       = results.filter((r) => !r.skipped);
  const avgAccuracy    = answered.length
    ? Math.round(answered.reduce((s, r) => s + r.accuracy, 0) / answered.length)
    : null;

  const timerPct   = timeLeft / GAME_DURATION;
  const timerColor =
    timeLeft <= 10 ? "text-red-400" : timeLeft <= 20 ? "text-amber-300" : "text-slate-200";
  const timerBar   =
    timeLeft <= 10 ? "#f87171" : timeLeft <= 20 ? "#fbbf24" : "linear-gradient(90deg, #0ea5e9, #a855f7)";

  // ── Lobby ─────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    const blocked = isAnon && !canAnonPlayToday(GAME_ID);

    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-5 ring-1 ring-white/10">
          <Compass className="h-10 w-10 text-cyan-300" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-semibold text-slate-100">How to play</h3>
          <ul className="text-sm text-slate-400 space-y-1.5 text-left list-none">
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">1.</span>A constellation appears at a random angle.</li>
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">2.</span>Drag the red compass needle to point toward true North.</li>
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">3.</span>Submit your answer and move on to the next one.</li>
            <li className="flex gap-2"><span className="text-cyan-400 shrink-0">4.</span>Score as many points as you can in <strong className="text-slate-200">90 seconds</strong>.</li>
          </ul>
        </div>

        {blocked ? (
          <div className="rounded-xl bg-slate-800/60 ring-1 ring-white/10 px-5 py-4 space-y-2 max-w-sm w-full">
            <p className="text-sm text-slate-300 font-medium">You've played today!</p>
            <p className="text-xs text-slate-500">
              Guest players get one free game per day. Sign up for unlimited plays and a persistent leaderboard spot.
            </p>
          </div>
        ) : (
          <button
            onClick={handleStartGame}
            className="rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            style={{ background: "linear-gradient(90deg, #0ea5e9, #a855f7)" }}
          >
            Start Game
          </button>
        )}

        {isAnon && !blocked && (
          <p className="text-xs text-slate-600">
            Guest players get 1 free play per day. Sign up for unlimited.
          </p>
        )}
      </div>
    );
  }

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (phase === "countdown") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div
          key={countdownCount}
          className="text-7xl font-bold text-transparent bg-clip-text animate-pulse"
          style={{ backgroundImage: "linear-gradient(135deg, #0ea5e9, #a855f7)" }}
        >
          {countdownCount > 0 ? countdownCount : "GO!"}
        </div>
        <p className="text-slate-400 text-sm">Get ready…</p>
      </div>
    );
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (phase === "finished") {
    return (
      <div className="flex flex-col gap-6">
        {/* Score summary */}
        <div className="rounded-2xl bg-slate-800/60 ring-1 ring-white/10 p-5 space-y-4">
          <h3 className="text-lg font-bold text-slate-100 text-center">Game Over!</h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-900/60 p-3">
              <div
                className="text-2xl font-bold text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #0ea5e9, #a855f7)" }}
              >
                {totalScore}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Total pts</div>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-3">
              <div className="text-2xl font-bold text-slate-100">{results.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Answered</div>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-3">
              <div className="text-2xl font-bold text-amber-300">
                {avgAccuracy !== null ? `${avgAccuracy}°` : "—"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Avg error</div>
            </div>
          </div>

          {/* Round breakdown */}
          {results.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm rounded-lg bg-slate-900/40 px-3 py-2"
                >
                  <span className="text-slate-300 truncate max-w-[55%]">{r.constellationName}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {r.skipped ? (
                      <span className="text-slate-500 text-xs">skipped</span>
                    ) : (
                      <span className="text-xs text-slate-500">{r.accuracy}° off</span>
                    )}
                    <span
                      className={`font-semibold w-8 text-right ${
                        r.score >= 80 ? "text-emerald-400" : r.score >= 50 ? "text-amber-400" : "text-red-400"
                      }`}
                    >
                      {r.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit to leaderboard */}
        {!scoreSubmitted ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 24))}
                placeholder="Your display name"
                maxLength={24}
                className="flex-1 rounded-xl bg-slate-800/60 ring-1 ring-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-cyan-500/50"
              />
              <button
                onClick={handleSubmitScore}
                disabled={submitting || results.length === 0}
                className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(90deg, #0ea5e9, #a855f7)" }}
              >
                {submitting ? "Saving…" : "Submit Score"}
              </button>
            </div>
            {isAnon && (
              <p className="text-xs text-slate-500 text-center">
                Sign up to track your scores and play unlimited times per day.
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-emerald-400 font-medium">
            Score submitted!
          </p>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-slate-200">Leaderboard</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 w-8">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Player</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Pts</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Rds</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Avg err</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span className={i === 0 ? "font-bold text-amber-400" : i === 1 ? "font-bold text-slate-300" : i === 2 ? "font-bold text-amber-600" : "text-slate-500"}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 truncate max-w-[120px]">{entry.displayName}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-cyan-300">{entry.score}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400">{entry.rounds}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 text-xs">{Math.round(entry.avgAccuracy)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Play again */}
        <div className="flex justify-center">
          <button
            onClick={handleStartGame}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 active:scale-95 transition-all"
            style={{ background: "linear-gradient(90deg, #0ea5e9, #a855f7)" }}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // ── Playing / Transitioning ───────────────────────────────────────────────
  const isTransitioning = phase === "transitioning";
  const flashColor =
    lastResult && !lastResult.skipped
      ? lastResult.score >= 80
        ? "rgba(52,211,153,0.18)"
        : lastResult.score >= 40
        ? "rgba(251,191,36,0.15)"
        : "rgba(248,113,113,0.18)"
      : undefined;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer + round count bar */}
      <div className="w-full max-w-[520px] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span className={`font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
            <span className="text-slate-600">remaining</span>
          </span>
          <span className="text-xs text-slate-500 tabular-nums">
            {results.length} answered · {results.reduce((s, r) => s + r.score, 0)} pts
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200 ease-linear"
            style={{ width: `${timerPct * 100}%`, background: timerBar }}
          />
        </div>
      </div>

      {/* Canvas + needle */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[520px] select-none"
        style={{
          touchAction: "none",
          transition: "box-shadow 0.2s",
          boxShadow: isTransitioning && flashColor
            ? `inset 0 0 0 3px ${flashColor}, 0 0 40px ${flashColor}`
            : undefined,
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl ring-1 ring-white/10 shadow-[0_8px_32px_rgba(2,6,23,0.6)] block"
          style={{
            cursor: isTransitioning ? "default" : "crosshair",
            opacity: isTransitioning ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        />

        {/* Transition flash overlay */}
        {isTransitioning && lastResult && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl">
            <div className="rounded-2xl px-6 py-3 text-center backdrop-blur-sm bg-black/40">
              <div
                className={`text-2xl font-bold ${
                  lastResult.skipped
                    ? "text-slate-400"
                    : lastResult.score >= 80
                    ? "text-emerald-300"
                    : lastResult.score >= 40
                    ? "text-amber-300"
                    : "text-red-400"
                }`}
              >
                {lastResult.skipped ? "Skipped" : `+${lastResult.score}`}
              </div>
              {!lastResult.skipped && (
                <div className="text-xs text-slate-400 mt-0.5">{lastResult.accuracy}° off</div>
              )}
            </div>
          </div>
        )}

        {/* SVG needle overlay */}
        {canvasSize > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox={`0 0 ${canvasSize} ${canvasSize}`}
          >
            {/* Player needle */}
            <g transform={`translate(${canvasSize / 2},${canvasSize / 2}) rotate(${needleAngle})`}>
              <line x1={0} y1={0} x2={0} y2={-needleLen}
                stroke={isTransitioning ? "rgba(248,113,113,0.4)" : "#f87171"}
                strokeWidth={2.5} strokeLinecap="round" />
              <polygon
                points={`0,${-needleLen - 10} -7,${-needleLen + 6} 7,${-needleLen + 6}`}
                fill={isTransitioning ? "rgba(248,113,113,0.4)" : "#f87171"} />
              <line x1={0} y1={0} x2={0} y2={needleLen * 0.6}
                stroke={isTransitioning ? "rgba(96,165,250,0.4)" : "#60a5fa"}
                strokeWidth={2.5} strokeLinecap="round" />
              <circle cx={0} cy={0} r={5} fill="rgba(255,255,255,0.9)" />
              {/* N? label — counter-rotated to stay upright */}
              <text
                x={0} y={-needleLen - 18}
                textAnchor="middle" fontSize={13} fontWeight="bold"
                fill={isTransitioning ? "rgba(248,113,113,0.4)" : "#f87171"}
                transform={`rotate(${-needleAngle}, 0, ${-needleLen - 18})`}
              >
                N?
              </text>
            </g>

            {/* True North revealed during transition */}
            {isTransitioning && (
              <g transform={`translate(${canvasSize / 2},${canvasSize / 2}) rotate(${trueNorthAngle})`}>
                <line x1={0} y1={0} x2={0} y2={-needleLen}
                  stroke="#34d399" strokeWidth={2.5}
                  strokeLinecap="round" strokeDasharray="6 3" />
                <polygon
                  points={`0,${-needleLen - 10} -7,${-needleLen + 6} 7,${-needleLen + 6}`}
                  fill="#34d399" />
                <text
                  x={0} y={-needleLen - 18}
                  textAnchor="middle" fontSize={13} fontWeight="bold"
                  fill="#34d399"
                  transform={`rotate(${-trueNorthAngle}, 0, ${-needleLen - 18})`}
                >
                  N
                </text>
              </g>
            )}
          </svg>
        )}

        {/* Hint */}
        {!isTransitioning && (
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/60 backdrop-blur-sm ring-1 ring-white/10">
              <Compass className="inline-block mr-1 h-3 w-3" />
              Drag to point North
            </span>
          </div>
        )}
      </div>

      {/* Constellation name */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-100">{constellation.name}</h2>
        <p className="text-sm text-slate-500 max-w-sm">{constellation.description}</p>
      </div>

      {/* Action buttons */}
      {!isTransitioning && (
        <div className="flex gap-3">
          <button
            onClick={() => submitRound(false)}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            style={{ background: "linear-gradient(90deg, #0ea5e9, #a855f7)" }}
          >
            Submit
          </button>
          <button
            onClick={() => submitRound(true)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 ring-1 ring-white/10 hover:text-slate-200 hover:ring-white/20 transition-all"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </button>
        </div>
      )}
    </div>
  );
};

export default ConstellationGame;
