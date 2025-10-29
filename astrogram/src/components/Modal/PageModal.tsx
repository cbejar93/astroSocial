import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PageModalProps = {
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g., "max-w-4xl"
};

const PageModal: React.FC<PageModalProps> = ({ title, children, maxWidthClass }) => {
  const navigate = useNavigate();

  // Close on ESC + lock scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && navigate(-1);
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => navigate(-1)}
      />
      <div
        className={[
          "relative w-[92%] max-h-[86vh] overflow-hidden rounded-2xl",
          "ring-1 ring-white/10 bg-[#0E1626]/95 text-white shadow-2xl",
          maxWidthClass ?? "max-w-3xl",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
          <button
            onClick={() => navigate(-1)}
            className="rounded-md p-1.5 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(86vh-64px)]">{children}</div>
      </div>
    </div>
  );
};

export default PageModal;
