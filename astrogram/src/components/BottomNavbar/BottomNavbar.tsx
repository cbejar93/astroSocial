// src/components/BottomNavbar.tsx
import React, { useEffect, useState } from "react";
import { NavLink, useLocation }       from "react-router-dom";
import { Home, Search, PlusCircle, CloudSun } from "lucide-react";
import LavaLampIcon from "../Icons/LavaLampIcons";

type IconComponent = React.ComponentType<{ className?: string }>;

interface Tab {
  name: string;
  path: string;
  icon: IconComponent;
}

const tabs: Tab[] = [
  { name: "Home",    path: "/",         icon: Home         },
  { name: "Weather", path: "/weather",  icon: CloudSun     },
  { name: "Post",    path: "/upload",   icon: PlusCircle   },
  { name: "Lounges", path: "/lounge",   icon: LavaLampIcon },
  { name: "Search",  path: "/search",   icon: Search       },
];

const BottomNavbar: React.FC = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const idx = tabs.findIndex(tab => tab.path === location.pathname);
    if (idx !== -1) setActiveIndex(idx);
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-neutral-800 z-50">
      <div className="relative flex justify-around items-center h-16">
        {/* Sliding highlight */}
        <div
          className="absolute top-2 left-0 w-1/5 transition-transform duration-300 ease-in-out px-2"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        >
          <div className="h-12 w-full bg-[#EDCC8B] rounded-xl" />
        </div>

        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const Icon     = tab.icon as IconComponent;

          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className="relative z-10 flex flex-1 flex-col items-center justify-center h-full"
              aria-label={tab.name}
            >
              <Icon
                className={`w-6 h-6 transition-colors duration-200 ${
                  isActive ? "text-black" : "text-sky-400"
                }`}
              />
              <span
                className={`text-xs transition-colors duration-200 mt-1 ${
                  isActive ? "text-black" : "text-sky-400"
                }`}
              >
                {tab.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
