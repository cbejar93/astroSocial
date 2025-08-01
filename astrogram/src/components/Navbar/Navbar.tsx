import { Menu, Bell, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";



const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { count } = useNotifications();


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setDropdownOpen((prev) => !prev);
    } else if (event.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-transparent  text-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-5">
          <button className="btn-unstyled" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>

          {/* ColliMate Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="btn-unstyled flex items-center gap-1"
              onClick={() => setDropdownOpen((prev) => !prev)}
              onKeyDown={handleKeyDown}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <span className="text-lg font-semibold leading-none">ColliMate</span>
              {/* <ChevronDown className="w-4 h-4 align-middle" /> */}
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-40 bg-neutral-900 border border-neutral-700 rounded shadow-md animate-slide-down">
                <ul className="py-2">
                  <li className="px-4 py-2 hover:bg-neutral-800 cursor-pointer">Dashboard</li>
                  <li className="px-4 py-2 hover:bg-neutral-800 cursor-pointer">Projects</li>
                  <li className="px-4 py-2 hover:bg-neutral-800 cursor-pointer">Settings</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-5">
          <Link
            to={user ? '/notifications' : '/signup'}
            className="btn-unstyled"
            aria-label="Notifications"
          >
            <div className="relative">
              <Bell className="w-6 h-6" />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {count}
                </span>
              )}
            </div>
          </Link>
          <Link to={user ? '/profile' : '/signup'} className="btn-unstyled" aria-label="Account">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 m-auto text-gray-400" />
          )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
