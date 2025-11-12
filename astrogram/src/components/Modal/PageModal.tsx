// src/components/Modal/PageModal.tsx
import React, { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PageModalProps = {
  title: string;
  children: React.ReactNode;
  /** Tailwind max-width utility, e.g. "max-w-4xl" */
  maxWidthClass?: string;
};

const PageModal: React.FC<PageModalProps> = ({ title, children, maxWidthClass }) => {
  const navigate = useNavigate();
  const titleId = useId();
  const [open, setOpen] = useState(false);

  // Open animation + ESC close + lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && navigate(-1);
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // animate in
    const raf = requestAnimationFrame(() => setOpen(true));

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        className={[
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={() => navigate(-1)}
      />

      {/* Aurora border wrapper */}
      <div
        className={[
          "relative w-[92%]",
          maxWidthClass ?? "max-w-3xl",
          "p-[1px] rounded-2xl",
          "bg-[conic-gradient(at_20%_-10%,rgba(240,75,179,.35),rgba(90,162,255,.35),rgba(34,197,94,.2),rgba(240,75,179,.35))]",
          "shadow-[0_20px_80px_rgba(0,0,0,.55)]",
          "transition-all duration-200",
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-[0.98]",
        ].join(" ")}
      >
        {/* Panel */}
        <div className="rounded-2xl ring-1 ring-white/10 bg-[#0E1626]/95 text-white overflow-hidden">
          {/* Sticky header */}
          <div className="sticky top-0 z-10">
            <div className="flex items-center justify-between px-5 py-4 bg-[#0E1626]/95 border-b border-white/10 backdrop-blur-sm">
              <h2 id={titleId} className="text-sm font-semibold tracking-wide">
                {title}
              </h2>
              <button
                onClick={() => navigate(-1)}
                className="rounded-md p-1.5 ring-1 ring-white/10 hover:bg-white/10 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Accent hairline */}
            <div className="h-[2px] bg-gradient-to-r from-[#f04bb3]/50 via-white/10 to-[#5aa2ff]/50" />
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[calc(86vh-64px)]">
            {children}
          </div>

          {/* Optional soft bottom glow */}
          <div className="pointer-events-none h-3 bg-gradient-to-b from-transparent to-black/10" />
        </div>
      </div>
    </div>
  );
};

export default PageModal;
