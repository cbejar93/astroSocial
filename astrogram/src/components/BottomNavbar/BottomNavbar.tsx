import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  PlusCircle,
  CloudSun,
  MessageCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const tabs = [
  { name: "Home", icon: Home, path: "/" },
  { name: "Search", icon: Search, path: "/search" },
  { name: "Post", icon: PlusCircle, path: "/upload" },
  { name: "Weather", icon: CloudSun, path: "/weather" },
  { name: "Messages", icon: MessageCircle, path: "/messages" },
];

const BottomNavbar: React.FC = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const idx = tabs.findIndex((tab) => tab.path === location.pathname);
    if (idx !== -1) setActiveIndex(idx);
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-neutral-800 z-50">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-1 transition-all duration-200 ${
                  isActive ? "text-violet-500 scale-110" : "text-gray-400 hover:text-white"
                }`
              }
              aria-label={tab.name}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{tab.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;