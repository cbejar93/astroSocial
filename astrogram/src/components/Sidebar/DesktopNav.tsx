import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CloudSun, Home, Search, PlusCircle } from "lucide-react";
import LavaLampIcon from "../Icons/LavaLampIcons";

type IconComponent = React.ComponentType<{ className?: string }>;

type NavItem = {
  label: string;
  to: string;
  icon: IconComponent;
  matchStartsWith?: string;
};

const navItems: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Weather", to: "/weather", icon: CloudSun },
  { label: "Post", to: "/upload", icon: PlusCircle },
  { label: "Lounges", to: "/lounge", icon: LavaLampIcon, matchStartsWith: "/lounge" },
  { label: "Search", to: "/search", icon: Search },
];

const DesktopNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-16 left-4 md:left-8 2xl:left-[calc((100vw-1536px)/2+2rem)] w-64 flex flex-col gap-2 max-h-[calc(100vh-4rem)] overflow-auto pr-2">
      {navItems.map(({ label, to, icon: Icon, matchStartsWith }) => {
        const isActive = matchStartsWith
          ? location.pathname.startsWith(matchStartsWith)
          : location.pathname === to;

        return (
          <NavLink
            key={label}
            to={to}
            className={({ isActive: navLinkActive }) => {
              const active = navLinkActive || isActive;

              return `group flex items-center gap-4 rounded-2xl px-5 py-3 text-lg font-medium transition-colors duration-200 ${
                active
                  ? "bg-slate-800 text-white shadow-lg shadow-slate-900/40"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`;
            }}
            aria-label={label}
          >
            <Icon
              className="h-7 w-7 text-sky-400 transition-transform duration-200 group-hover:scale-105"
            />
            <span
              className="transition-colors duration-200 text-slate-300 group-hover:text-white lg:bg-gradient-to-b lg:from-[#0b3d91] lg:via-[#3a1c71] lg:to-[#5a189a] lg:bg-clip-text lg:text-transparent lg:group-hover:text-transparent lg:hover:text-transparent"
            >
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
