// src/components/Comments/CommentsSkeleton.tsx
import React from "react";

const CommentsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="mt-4 space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex gap-2 py-2 border-t border-b border-white/20"
        >
          <div className="w-8 h-8 bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-1/4 bg-gray-700 rounded" />
            <div className="h-4 w-full bg-gray-700 rounded" />
            <div className="h-3 w-10 bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentsSkeleton;
