import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  PlusCircle,
  CloudSun,
  MessageCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const tabs = [
  { name: "Home", icon: Home, path: "/" },
  { name: "Weather", icon: CloudSun, path: "/weather" },
  { name: "Post", icon: PlusCircle, path: "/upload" },
  { name: "Messages", icon: MessageCircle, path: "/messages" },
  { name: "Search", icon: Search, path: "/search" },
];

const BottomNavbar: React.FC = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const idx = tabs.findIndex((tab) => tab.path === location.pathname);
    if (idx !== -1) setActiveIndex(idx);
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-neutral-800 z-50">
      <div className="relative flex justify-around items-center h-16">
        {/* Sliding background */}
        <div
          className="absolute top-2 left-0 w-1/5 transition-transform duration-300 ease-in-out px-2"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        >
          <div className="h-12 w-full bg-[#EDCC8B] rounded-xl"></div>
        </div>

        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeIndex === index;

          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={`relative z-10 flex flex-1 flex-col items-center justify-center h-full no-underline`}
              aria-label={tab.name}
              style={{ textDecoration: "none" }} // extra inline fallback
            >
              <Icon
                className={`w-6 h-6 transition-colors duration-200 ${
                  isActive ? "text-black" : "text-sky-400"
                }`}
              />
              <span
                className={`text-xs transition-colors duration-200 ${
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