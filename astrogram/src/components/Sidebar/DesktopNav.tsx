import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CloudSun, Home, Search, PlusCircle } from "lucide-react";
import LavaLampIcon from "../Icons/LavaLampIcons";
import "./DesktopNav.css";

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
    <nav className="desktop-nav fixed top-16 left-4 md:left-8 2xl:left-[calc((100vw-1536px)/2+2rem)] w-64">
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

              return [
                "desktop-nav__link",
                active ? "desktop-nav__link--active" : "",
              ]
                .filter(Boolean)
                .join(" ");
            }}
            aria-label={label}
          >
            <Icon className="desktop-nav__icon" />
            <span className="desktop-nav__label">
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
