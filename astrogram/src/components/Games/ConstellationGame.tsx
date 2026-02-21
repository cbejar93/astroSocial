import React, { useCallback, useEffect, useRef, useState } from "react";
import { CONSTELLATIONS, type Constellation } from "../../data/constellations";
import { RefreshCw, Compass, CheckCircle, Trophy, Clock } from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[], exclude?: T): T {
  const pool = exclude ? arr.filter((x) => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Simple seedable pseudo-random (mulberry32) */
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

function scoreLabel(score: number): { text: string; color: string } {
  if (score >= 95) return { text: "Perfect!", color: "text-emerald-300" };
  if (score >= 80) return { text: "Excellent!", color: "text-emerald-300" };
  if (score >= 60) return { text: "Good job!", color: "text-amber-300" };
  if (score >= 40) return { text: "Not bad!", color: "text-amber-300" };
  return { text: "Keep practicing!", color: "text-red-400" };
}

// ─── Canvas drawing ──────────────────────────────────────────────────────────

function drawScene(
  canvas: HTMLCanvasElement,
  constellation: Constellation,
  rotationDeg: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const scale = Math.min(W, H) * 0.38;

  // Background
  ctx.fillStyle = "#060a18";
  ctx.fillRect(0, 0, W, H);

  // Background stars (seeded for consistency per constellation)
  const rand = mulberry32(constellation.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  for (let i = 0; i < 160; i++) {
    const bx = rand() * W;
    const by = rand() * H;
    const br = rand() * 1.2 + 0.2;
    const alpha = rand() * 0.5 + 0.1;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${alpha})`;
    ctx.fill();
  }

  // Apply constellation rotation
  const rotRad = (rotationDeg * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotRad);

  // Projection: canvas y is flipped (positive down), constellation y is positive up
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

  // Stars
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
    // Solid core
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();

    // Name label — counter-rotate so text stays right-side up regardless of constellation rotation
    if (star.name && star.magnitude <= 2.5) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-rotRad); // undo the constellation rotation for this text only
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "rgba(180,220,255,0.75)";
      ctx.fillText(star.name, r + 3, 4);
      ctx.restore();
    }
  }

  ctx.restore();

  // Subtle center cross-hair
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx, cy + 12);
  ctx.moveTo(cx - 12, cy);
  ctx.lineTo(cx + 12, cy);
  ctx.stroke();
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

const LEADERBOARD_KEY = "constellation-leaderboard";
const ROUND_TIME = 30; // seconds

interface LeaderboardEntry {
  constellation: string;
  score: number;
  time: number;     // seconds taken
  accuracy: number; // degrees off
  date: string;
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

// ─── Component ───────────────────────────────────────────────────────────────

type Phase = "playing" | "result";

const ConstellationGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [constellation, setConstellation] = useState<Constellation>(() =>
    pickRandom(CONSTELLATIONS)
  );
  const [rotation, setRotation] = useState(() => Math.floor(Math.random() * 360));
  const [needleAngle, setNeedleAngle] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<number | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadLeaderboard);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const dragging = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  // Refs to read current values inside timer effect without stale closures
  const needleAngleRef = useRef(needleAngle);
  const rotationRef = useRef(rotation);
  const constellationRef = useRef(constellation);
  needleAngleRef.current = needleAngle;
  rotationRef.current = rotation;
  constellationRef.current = constellation;

  // ── Canvas size ──────────────────────────────────────────────────────────
  const [canvasSize, setCanvasSize] = useState(400);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setCanvasSize(Math.min(containerRef.current.clientWidth, 520));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Draw ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    drawScene(canvas, constellation, rotation);
  }, [constellation, rotation, canvasSize]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      // Auto-submit using refs to avoid stale closure
      const trueNorth = (360 - rotationRef.current) % 360;
      const err = angleError(needleAngleRef.current, trueNorth);
      const s = calcScore(err);
      const entry: LeaderboardEntry = {
        constellation: constellationRef.current.name,
        score: s,
        time: ROUND_TIME,
        accuracy: Math.round(err),
        date: new Date().toLocaleDateString(),
      };
      setTimeTaken(ROUND_TIME);
      setError(Math.round(err));
      setScore(s);
      setPhase("result");
      setLeaderboard((prev) => {
        const updated = [...prev, entry]
          .sort((a, b) => b.score - a.score || a.time - b.time)
          .slice(0, 10);
        saveLeaderboard(updated);
        return updated;
      });
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timeLeft]);

  // ── Compass needle drag ──────────────────────────────────────────────────
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

  // ── Submit answer ────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const taken = Math.min(ROUND_TIME, Math.round((Date.now() - startTimeRef.current) / 1000));
    const trueNorth = (360 - rotation) % 360;
    const err = angleError(needleAngle, trueNorth);
    const s = calcScore(err);
    const entry: LeaderboardEntry = {
      constellation: constellation.name,
      score: s,
      time: taken,
      accuracy: Math.round(err),
      date: new Date().toLocaleDateString(),
    };
    setTimeTaken(taken);
    setError(Math.round(err));
    setScore(s);
    setPhase("result");
    setLeaderboard((prev) => {
      const updated = [...prev, entry]
        .sort((a, b) => b.score - a.score || a.time - b.time)
        .slice(0, 10);
      saveLeaderboard(updated);
      return updated;
    });
  };

  // ── Next round ───────────────────────────────────────────────────────────
  const handleNext = () => {
    const next = pickRandom(CONSTELLATIONS, constellation);
    setConstellation(next);
    setRotation(Math.floor(Math.random() * 360));
    setNeedleAngle(0);
    setScore(null);
    setError(null);
    setTimeTaken(null);
    setTimeLeft(ROUND_TIME);
    setPhase("playing");
    startTimeRef.current = Date.now();
  };

  // ── Needle geometry ──────────────────────────────────────────────────────
  const needleLen = canvasSize * 0.38;
  const label = score !== null ? scoreLabel(score) : null;
  const trueNorthRotation = (360 - rotation) % 360;

  // Timer bar color
  const timerColor =
    timeLeft <= 5 ? "text-red-400" : timeLeft <= 10 ? "text-amber-300" : "text-slate-300";
  const timerBarBg =
    timeLeft <= 5
      ? "#f87171"
      : timeLeft <= 10
      ? "#fbbf24"
      : "linear-gradient(90deg, #0ea5e9, #a855f7)";

  return (
    <div className="flex flex-col items-center gap-6">

      {/* Timer bar */}
      {phase === "playing" && (
        <div className="w-full max-w-[520px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              Time remaining
            </span>
            <span className={`text-sm font-bold tabular-nums ${timerColor}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${(timeLeft / ROUND_TIME) * 100}%`,
                background: timerBarBg,
              }}
            />
          </div>
        </div>
      )}

      {/* Canvas + needle overlay */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[520px] select-none"
        style={{ touchAction: "none" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl ring-1 ring-white/10 shadow-[0_8px_32px_rgba(2,6,23,0.6)] block"
          style={{ cursor: phase === "playing" ? "crosshair" : "default" }}
        />

        {/* Compass needle — centered SVG overlay */}
        {canvasSize > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox={`0 0 ${canvasSize} ${canvasSize}`}
          >
            {/* Player's needle */}
            <g transform={`translate(${canvasSize / 2},${canvasSize / 2}) rotate(${needleAngle})`}>
              {/* North tip (red) */}
              <line
                x1={0} y1={0} x2={0} y2={-needleLen}
                stroke={phase === "result" ? "rgba(248,113,113,0.5)" : "#f87171"}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {/* Arrowhead */}
              <polygon
                points={`0,${-needleLen - 10} -7,${-needleLen + 6} 7,${-needleLen + 6}`}
                fill={phase === "result" ? "rgba(248,113,113,0.5)" : "#f87171"}
              />
              {/* South tip (blue) */}
              <line
                x1={0} y1={0} x2={0} y2={needleLen * 0.6}
                stroke={phase === "result" ? "rgba(96,165,250,0.5)" : "#60a5fa"}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {/* Center dot */}
              <circle cx={0} cy={0} r={5} fill="rgba(255,255,255,0.9)" />
              {/* N? label — counter-rotated so it always stays right-side up */}
              <text
                x={0}
                y={-needleLen - 18}
                textAnchor="middle"
                fontSize={13}
                fontWeight="bold"
                fill={phase === "result" ? "rgba(248,113,113,0.5)" : "#f87171"}
                transform={`rotate(${-needleAngle}, 0, ${-needleLen - 18})`}
              >
                N?
              </text>
            </g>

            {/* True North arrow shown on result */}
            {phase === "result" && (
              <g transform={`translate(${canvasSize / 2},${canvasSize / 2}) rotate(${trueNorthRotation})`}>
                <line
                  x1={0} y1={0} x2={0} y2={-needleLen}
                  stroke="#34d399"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray="6 3"
                />
                <polygon
                  points={`0,${-needleLen - 10} -7,${-needleLen + 6} 7,${-needleLen + 6}`}
                  fill="#34d399"
                />
                {/* N label — counter-rotated so it always stays right-side up */}
                <text
                  x={0}
                  y={-needleLen - 18}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight="bold"
                  fill="#34d399"
                  transform={`rotate(${-trueNorthRotation}, 0, ${-needleLen - 18})`}
                >
                  N
                </text>
              </g>
            )}
          </svg>
        )}

        {/* Instruction overlay when playing */}
        {phase === "playing" && (
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/70 backdrop-blur-sm ring-1 ring-white/10">
              <Compass className="inline-block mr-1 h-3 w-3" />
              Drag anywhere to rotate the needle toward true North
            </span>
          </div>
        )}
      </div>

      {/* Constellation name */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-100">{constellation.name}</h2>
        <p className="mt-1 text-sm text-slate-400 max-w-sm">{constellation.description}</p>
      </div>

      {/* Result panel */}
      {phase === "result" && score !== null && label && (
        <div className="w-full max-w-[520px] rounded-2xl bg-slate-900/60 backdrop-blur-md ring-1 ring-white/10 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <span className={`text-lg font-bold ${label.color}`}>{label.text}</span>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-slate-300 text-sm">
                  Score: <strong className={label.color}>{score}</strong>/100
                  {error !== null && (
                    <span className="ml-2 text-slate-400 text-xs">({error}° off)</span>
                  )}
                </span>
                {timeTaken !== null && (
                  <span className="flex items-center gap-1 text-slate-400 text-xs">
                    <Clock className="h-3 w-3" />
                    {timeTaken}s{timeTaken >= ROUND_TIME ? " — time's up!" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-cyan-500/40 pl-3">
            {constellation.navigationTip}
          </p>
        </div>
      )}

      {/* Leaderboard */}
      <div className="w-full max-w-[520px]">
        <button
          onClick={() => setShowLeaderboard((s) => !s)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Trophy className="h-4 w-4 text-amber-400" />
          {showLeaderboard ? "Hide" : "Show"} Leaderboard
          {leaderboard.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs text-amber-400 ring-1 ring-amber-400/30">
              {leaderboard.length}
            </span>
          )}
        </button>

        {showLeaderboard && (
          <div className="mt-3 rounded-2xl bg-slate-900/60 backdrop-blur-md ring-1 ring-white/10 overflow-hidden">
            {leaderboard.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">
                No entries yet — complete a round to appear here!
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 w-8">#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Constellation</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Score</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Time</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Off by</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className={
                            i === 0
                              ? "font-bold text-amber-400"
                              : i === 1
                              ? "font-bold text-slate-300"
                              : i === 2
                              ? "font-bold text-amber-600"
                              : "text-slate-500"
                          }
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{entry.constellation}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={
                            entry.score >= 80
                              ? "text-emerald-400"
                              : entry.score >= 60
                              ? "text-amber-400"
                              : "text-red-400"
                          }
                        >
                          {entry.score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400 tabular-nums">{entry.time}s</td>
                      <td className="px-4 py-2.5 text-right text-slate-500 text-xs tabular-nums">{entry.accuracy}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {phase === "playing" ? (
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(90deg, #0ea5e9, #a855f7)" }}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(90deg, #0ea5e9, #a855f7)" }}
          >
            <RefreshCw className="h-4 w-4" />
            Next Constellation
          </button>
        )}
      </div>
    </div>
  );
};

export default ConstellationGame;
