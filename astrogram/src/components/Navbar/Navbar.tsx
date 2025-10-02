import { Menu, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { fetchLounges } from "../../lib/api";

interface LoungeInfo {
  id: string;
  name: string;
  description: string | null;
  bannerUrl: string;
  profileUrl: string;
  threads: number;
  followers: number;
  lastPostAt: string | null;
}



const Navbar = () => {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [loungesOpen, setLoungesOpen] = useState(false);
  const [loungesList, setLoungesList] = useState<LoungeInfo[]>([]);
  const { user } = useAuth();
  const { count } = useNotifications();
  const location = useLocation();
  const isProfilePage = location.pathname.startsWith('/profile');


  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSideMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    fetchLounges<LoungeInfo>()
      .then(setLoungesList)
      .catch(() => {});
  }, []);
  return (
    <>
    <nav className="fixed top-0 left-0 z-[80] w-full bg-transparent  text-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Left Section */}
        <div className="flex items-center gap-3 sm:gap-5">
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

          <span className="text-base font-semibold leading-none sm:text-lg whitespace-nowrap">
            AstroLounge
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-5">
          {user ? (
            <>
              <Link
                to="/notifications"
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
              {!isProfilePage && (
                <Link to="/profile" className="btn-unstyled" aria-label="Account">
                  <img
                    src={user?.avatarUrl ?? '/defaultPfp.png'}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </Link>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-md border border-neutral-700 bg-neutral-900/60 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap transition-colors hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70 sm:px-4 sm:py-2 sm:text-sm"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-md bg-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-fuchsia-400 focus-visible:bg-fuchsia-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400/70 sm:px-4 sm:py-2 sm:text-sm"
              >
                Sign up
              </Link>
            </div>
          )}
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
                <li>
                  <Link to="/lounge" onClick={() => setSideMenuOpen(false)}>
                    All Lounges
                  </Link>
                </li>
                {loungesList.length === 0 ? (
                  <li className="text-neutral-500">No lounges available</li>
                ) : (
                  loungesList.map((lounge) => (
                    <li key={lounge.id}>
                      <Link
                        to={`/lounge/${encodeURIComponent(lounge.name)}`}
                        onClick={() => setSideMenuOpen(false)}
                      >
                        {lounge.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
            <Link
              to="/saved"
              onClick={() => setSideMenuOpen(false)}
              className="block mt-4 mb-1 text-lg font-semibold"
            >
              Saved
            </Link>
            <Link
              to="/settings"
              onClick={() => setSideMenuOpen(false)}
              className="block mb-1 text-lg font-semibold"
            >
              Settings
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/lounge"
                onClick={() => setSideMenuOpen(false)}
                className="block mb-1 text-lg font-semibold"
              >
                Admin
              </Link>
            )}
          </div>
          <div className="absolute bottom-0 left-0 w-full p-4 text-sm space-y-1">
            <Link to="/terms" className="block">Terms and Conditions</Link>
            <Link to="/privacy" className="block">Privacy Policy</Link>
            <a href="#" className="block">Community Notes</a>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Navbar;
