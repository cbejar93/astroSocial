import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CloudSun, Home, Search } from "lucide-react";
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
  { label: "Lounges", to: "/lounge", icon: LavaLampIcon, matchStartsWith: "/lounge" },
  { label: "Search", to: "/search", icon: Search },
];

const DesktopNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="flex flex-col gap-2">
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

              return `group flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                active
                  ? "bg-slate-800 text-white shadow-lg shadow-slate-900/40"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`;
            }}
            aria-label={label}
          >
            <Icon
              className="h-5 w-5 text-sky-400 transition-transform duration-200 group-hover:scale-105"
            />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
