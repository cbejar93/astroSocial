import React from "react";

/**
 * Global reusable background for AstroLounge.
 * Keeps gradient, star overlay, and dark tone consistent.
 */
const AuroraBackground: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Deep base */}
      <div className="absolute inset-0 bg-[#0b0d1a]" />

      {/* Aurora gradient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(147,51,234,0.25),transparent),radial-gradient(900px_560px_at_80%_110%,rgba(99,102,241,0.18),transparent)]" />

      {/* Optional star layer */}
      <div className="absolute inset-0 bg-[url('/stars-overlay.png')] opacity-[0.12] mix-blend-screen" />
    </div>
  );
};

export default AuroraBackground;
