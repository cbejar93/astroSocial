// src/components/Comments/CommentsSkeleton.tsx
import React from 'react';

const CommentsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div
      className="mt-4 rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur
                 divide-y divide-white/10 animate-pulse"
      role="status"
      aria-live="polite"
      aria-label="Loading replies"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          {/* Avatar skeleton — fixed perfect circle 40x40 */}
          <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-gray-700/70" />

          {/* Text lines */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3 w-32 bg-gray-700/70 rounded" />
            <div className="h-4 w-[92%] bg-gray-700/70 rounded" />
            <div className="h-4 w-[80%] bg-gray-700/70 rounded" />
            <div className="h-3 w-16 bg-gray-700/70 rounded" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
};

export default CommentsSkeleton;
