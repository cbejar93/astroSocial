import { Menu, Bell, User, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";



const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [loungesOpen, setLoungesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { count } = useNotifications();


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSideMenuOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
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
    <>
    <nav className="fixed top-0 left-0 z-[80] w-full bg-transparent  text-white">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-5">
          <button
            className="btn-unstyled"
            aria-label="Toggle menu"
            aria-expanded={sideMenuOpen}
            onClick={() => setSideMenuOpen((o) => !o)}
          >
            <Menu
              className={`w-6 h-6 transition-transform duration-200 ${
                sideMenuOpen ? "rotate-90" : ""
              }`}
            />
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
            className="relative btn-unstyled"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            {count > 0 && (
              <span
                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                {count}
              </span>
            )}
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
    {sideMenuOpen && (
      <div className="fixed inset-0 z-[60] flex">
        <div
          className="absolute inset-0 bg-white/20 backdrop-blur-sm"
          onClick={() => setSideMenuOpen(false)}
        />
        <div className="relative bg-neutral-900 w-2/3 h-full p-4 animate-slide-in-left z-[70]">
          <div className="mt-10 space-y-2">
            <button className="flex items-center justify-between w-full py-2" onClick={() => setLoungesOpen(o => !o)}>
              <span className="text-lg font-semibold">Lounges</span>
              {loungesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {loungesOpen && (
              <ul className="pl-4 text-sm space-y-1">
                <li><Link to="/lounge" onClick={() => setSideMenuOpen(false)}>Astro Lounge</Link></li>
              </ul>
            )}
            <h3 className="mt-4 mb-1 text-lg font-semibold">Settings</h3>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-4 text-sm space-y-1">
            <Link to="/terms" className="block">Terms and Conditions</Link>
            <a href="#" className="block">Community Notes</a>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Navbar;
