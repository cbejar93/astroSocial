// src/components/BottomNavbar.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, CloudSun, User, Settings } from "lucide-react";
import LavaLampIcon from "../Icons/LavaLampIcons";

type IconComponent = React.ComponentType<{ className?: string }>;

interface Tab {
  name: string;
  path: string;
  icon: IconComponent;
}

// Match DesktopNav order and icons 1:1
const TABS: Tab[] = [
  { name: "Home",     path: "/",         icon: Home },
  { name: "Weather",  path: "/weather",  icon: CloudSun },
  { name: "Lounges",  path: "/lounge",   icon: LavaLampIcon },
  { name: "Profile",  path: "/profile",  icon: User },
  { name: "Settings", path: "/settings", icon: Settings },
];

// Same gradient accent family used elsewhere
const ACTIVE_GRADIENT = "bg-gradient-to-r from-[#f04bb3] to-[#5aa2ff]";

// Compact sizing to keep things tidy
const ICON_CLASS = "h-5 w-5 text-white";
const LABEL_CLASS = "text-[10px]";
const BAR_HEIGHT = "h-14";
const SEGMENT_HEIGHT = "h-12";

const BottomNavbar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        pb-[max(env(safe-area-inset-bottom),0px)]
        bg-transparent
      "
      aria-label="Bottom navigation"
      role="tablist"
    >
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 -z-10">
        <div
          className="mx-auto h-full max-w-3xl opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(70% 80% at 50% 0%, rgba(240,75,179,.24), rgba(90,162,255,.24), transparent 70%)",
          }}
        />
      </div>

      {/* Glass bar container */}
      <div className="mx-auto mb-2 max-w-3xl px-3">
        <div
          className={[
            "relative w-full items-stretch overflow-hidden",
            // ▼ Match top navbar: transparent + heavy blur
            "rounded-2xl bg-transparent backdrop-blur-2xl",
            "ring-1 ring-white/15 shadow-[0_10px_30px_rgba(2,6,23,0.15)]",
            "flex",
            BAR_HEIGHT,
          ].join(" ")}
        >
          {/* faint top hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

          {TABS.map((tab) => (
            <Segment key={tab.name} tab={tab} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
};

const Segment: React.FC<{ tab: Tab; pathname: string }> = ({ tab, pathname }) => {
  const Icon = tab.icon as IconComponent;
  const isHome = tab.path === "/";
  const derivedActive = isHome
    ? pathname === "/" || pathname.startsWith("/post")
    : pathname === tab.path || pathname.startsWith(`${tab.path}/`);

  return (
    <NavLink
      to={tab.path}
      end={isHome}
      role="tab"
      aria-label={tab.name}
      className="group relative grid flex-1 place-items-center px-1"
    >
      {({ isActive }) => {
        const active = derivedActive || isActive;

        return (
          <div className={["relative w-full max-w-[86px]", SEGMENT_HEIGHT].join(" ")}>
            {/* Active pill */}
            <div
              className={[
                "absolute inset-0 rounded-xl transition-all duration-300",
                active ? "opacity-100 scale-[1.02]" : "opacity-0 scale-100",
                ACTIVE_GRADIENT,
                "ring-1 ring-white/25 shadow-[0_8px_20px_rgba(15,23,42,0.45)]",
              ].join(" ")}
            />
            {/* Inner gloss when active */}
            <div
              className={[
                "pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300",
                active ? "opacity-25" : "opacity-0",
              ].join(" ")}
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,.32), transparent 60%)",
              }}
            />

            {/* Content */}
            <div className="relative z-10 grid h-full w-full place-items-center">
              <div className="flex flex-col items-center justify-center">
                <Icon
                  className={[
                    ICON_CLASS,
                    "transition-transform duration-200",
                    active ? "scale-[1.03]" : "group-active:scale-95",
                  ].join(" ")}
                />
                <span
                  className={[
                    "mt-1 font-medium tracking-wide",
                    LABEL_CLASS,
                    active ? "text-white" : "text-white/80",
                  ].join(" ")}
                >
                  {tab.name}
                </span>
              </div>
            </div>
          </div>
        );
      }}
    </NavLink>
  );
};

export default BottomNavbar;
