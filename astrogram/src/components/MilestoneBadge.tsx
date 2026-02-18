// src/components/MilestoneBadge.tsx
import React from "react";

const MILESTONES = [500, 250, 100, 50, 25, 10, 1] as const;

const MILESTONE_CONFIG: Record<
  number,
  { label: string; bg: string; text: string; ring: string }
> = {
  500: {
    label: "500 Posts",
    bg: "bg-gradient-to-r from-yellow-400/20 to-amber-400/20",
    text: "text-yellow-300",
    ring: "ring-yellow-400/40",
  },
  250: {
    label: "250 Posts",
    bg: "bg-gradient-to-r from-violet-400/20 to-fuchsia-400/20",
    text: "text-violet-300",
    ring: "ring-violet-400/40",
  },
  100: {
    label: "100 Posts",
    bg: "bg-gradient-to-r from-sky-400/20 to-cyan-400/20",
    text: "text-sky-300",
    ring: "ring-sky-400/40",
  },
  50: {
    label: "50 Posts",
    bg: "bg-gradient-to-r from-emerald-400/20 to-teal-400/20",
    text: "text-emerald-300",
    ring: "ring-emerald-400/40",
  },
  25: {
    label: "25 Posts",
    bg: "bg-gradient-to-r from-pink-400/20 to-rose-400/20",
    text: "text-pink-300",
    ring: "ring-pink-400/40",
  },
  10: {
    label: "10 Posts",
    bg: "bg-white/5",
    text: "text-slate-300",
    ring: "ring-white/20",
  },
  1: {
    label: "First Post",
    bg: "bg-white/5",
    text: "text-slate-400",
    ring: "ring-white/10",
  },
};

interface MilestoneBadgeProps {
  postMilestone: number;
  className?: string;
}

const MilestoneBadge: React.FC<MilestoneBadgeProps> = ({
  postMilestone,
  className = "",
}) => {
  if (!postMilestone) return null;

  const milestone = MILESTONES.find((m) => postMilestone >= m);
  if (!milestone) return null;

  const config = MILESTONE_CONFIG[milestone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${config.bg} ${config.text} ${config.ring} ${className}`}
      title={`Reached ${config.label} milestone`}
    >
      <svg
        className="w-3 h-3"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {config.label}
    </span>
  );
};

export default MilestoneBadge;
