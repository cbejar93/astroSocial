import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logoUrl from "../../../public/logo.png";
import {
  CloudSun,
  Home,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChartArea,
} from "lucide-react";
import LavaLampIcon from "../Icons/LavaLampIcons";
import { fetchLounges } from "../../lib/api";
import "./DesktopNav.css";
import { useAuth } from "../../hooks/useAuth";

type IconComponent = React.ComponentType<{ className?: string }>;

type NavItem = {
  label: string;
  to: string;
  icon: IconComponent;
  matchStartsWith?: string;
};

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

const navItems: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Weather", to: "/weather", icon: CloudSun },
  { label: "Lounges", to: "/lounge", icon: LavaLampIcon, matchStartsWith: "/lounge" },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Admin", to: "/admin/lounge", icon: ChartArea },

];

const slugFromName = (name: string) => encodeURIComponent(name);
const BRAND_NAME = "AstroLounge";

const DesktopNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [loungesOpen, setLoungesOpen] = useState<boolean>(
    location.pathname.startsWith("/lounge")
  );
  const [openLoungeId, setOpenLoungeId] = useState<string | null>(null);
  const [loungesList, setLoungesList] = useState<LoungeInfo[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchLounges<LoungeInfo>().then(setLoungesList).catch(() => {});
  }, []);

  useEffect(() => {
    setLoungesOpen(location.pathname.startsWith("/lounge"));
  }, [location.pathname]);

  useEffect(() => {
    if (collapsed) {
      setLoungesOpen(false);
      setOpenLoungeId(null);
    }
  }, [collapsed]);

  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) =>
      item.label === "Admin" ? user?.role === "ADMIN" : true
    );
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--desktop-nav-current-width",
      collapsed ? "var(--desktop-nav-collapsed)" : "var(--desktop-nav-expanded)"
    );

    return () => {
      root.style.setProperty("--desktop-nav-current-width", "var(--desktop-nav-expanded)");
    };
  }, [collapsed]);

  return (
    <nav
      className={[
        "desktop-nav",
        collapsed ? "desktop-nav--collapsed" : "desktop-nav--expanded",
        "fixed left-[var(--desktop-nav-offset)]",
      ].join(" ")}
      style={{
        width: collapsed ? "var(--desktop-nav-collapsed)" : "var(--desktop-nav-expanded)",
        height: "92vh",
        transition: "width .25s ease",
        zIndex: 100,
      }}
      aria-label="Primary"
    >
      {/* BRAND AREA */}
      <div className="desktop-nav__brand">
        <NavLink
          to="/"
          className="desktop-nav__brand-link"
          aria-label={`${BRAND_NAME} Home`}
          title={BRAND_NAME}
          onClick={(e) => {
            if (collapsed) {
              e.preventDefault();
              setCollapsed(false);
            }
          }}
        >
          <img src={logoUrl} alt={BRAND_NAME} className="desktop-nav__brand-icon" />
          {!collapsed && <span className="desktop-nav__brand-name">{BRAND_NAME}</span>}
        </NavLink>

        {/* Show collapse icon only when expanded */}
        {!collapsed && (
          <button
            type="button"
            className="desktop-nav__collapse-inline"
            aria-label="Collapse sidebar"
            title="Collapse"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCollapsed(true);
            }}
          >
            <ChevronLeft className="desktop-nav__collapse-icon" />
          </button>
        )}
      </div>

      {/* NAVIGATION LINKS */}
      <div id="desktop-nav-scroll" className="desktop-nav__scroll">
        {filteredNavItems.map(({ label, to, icon: Icon, matchStartsWith }) => {
          const isHome = label === "Home";
          const isActive = matchStartsWith
            ? location.pathname.startsWith(matchStartsWith)
            : isHome
            ? location.pathname === "/" || location.pathname.startsWith("/post")
            : location.pathname === to;

          if (label === "Lounges") {
            const groupActive = isActive;
            if (collapsed) {
              return (
                <NavLink
                  key="lounges-collapsed"
                  to="/lounge"
                  className={({ isActive: a }) =>
                    ["desktop-nav__link", a || groupActive ? "desktop-nav__link--active" : ""]
                      .filter(Boolean)
                      .join(" ")
                  }
                  aria-label="Lounges"
                  title="Lounges"
                >
                  <Icon className="desktop-nav__icon" />
                </NavLink>
              );
            }

            return (
              <div key="lounges-group" title="Lounges">
                <div
                  className={[
                    "desktop-nav__link",
                    groupActive ? "desktop-nav__link--active" : "",
                    "desktop-nav__group",
                  ].join(" ")}
                >
                  <NavLink
                    to="/lounge"
                    className="desktop-nav__group-link"
                    aria-label="Lounges"
                    title="Lounges"
                  >
                    <Icon className="desktop-nav__icon" />
                    <span className="desktop-nav__label">Lounges</span>
                  </NavLink>

                  <button
                    type="button"
                    aria-label="Toggle Lounges"
                    aria-expanded={loungesOpen}
                    aria-controls="lounges-subtree"
                    className="desktop-nav__toggle"
                    onClick={() => setLoungesOpen((o) => !o)}
                  >
                    {loungesOpen ? (
                      <ChevronUp className="desktop-nav__chevron" />
                    ) : (
                      <ChevronDown className="desktop-nav__chevron" />
                    )}
                  </button>
                </div>

                {!collapsed && loungesOpen && (
                  <div id="lounges-subtree" className="desktop-nav__subtree">
                    <ul className="desktop-nav__sublist">
                      {loungesList.length === 0 ? (
                        <li className="desktop-nav__subempty">No lounges available</li>
                      ) : (
                        loungesList.map((l) => {
                          const slug = slugFromName(l.name);
                          const open = openLoungeId === l.id;
                          return (
                            <li key={l.id} className="desktop-nav__subitem">
                              <div className="desktop-nav__sublounge">
                                <NavLink
                                  to={`/lounge/${slug}`}
                                  className={({ isActive }) =>
                                    [
                                      "desktop-nav__sublink",
                                      isActive ? "desktop-nav__sublink--active" : "",
                                    ].join(" ")
                                  }
                                >
                                  <span className="desktop-nav__dot" aria-hidden="true" />
                                  {l.name}
                                </NavLink>
                                <button
                                  type="button"
                                  className="desktop-nav__mini-toggle"
                                  aria-expanded={open}
                                  onClick={() => setOpenLoungeId(open ? null : l.id)}
                                >
                                  {open ? (
                                    <ChevronUp className="desktop-nav__chevron--mini" />
                                  ) : (
                                    <ChevronDown className="desktop-nav__chevron--mini" />
                                  )}
                                </button>
                              </div>

                              {open && (
                                <ul className="desktop-nav__subsublist">
                                  <li>
                                    <NavLink
                                      to={`/lounge/${slug}`}
                                      className={({ isActive }) =>
                                        [
                                          "desktop-nav__subsublink",
                                          isActive ? "desktop-nav__subsublink--active" : "",
                                        ].join(" ")
                                      }
                                    >
                                      Overview
                                    </NavLink>
                                  </li>
                                  <li>
                                    <NavLink
                                      to={`/lounge/${slug}/threads`}
                                      className={({ isActive }) =>
                                        [
                                          "desktop-nav__subsublink",
                                          isActive ? "desktop-nav__subsublink--active" : "",
                                        ].join(" ")
                                      }
                                    >
                                      Threads
                                    </NavLink>
                                  </li>
                                  <li>
                                    <NavLink
                                      to={`/lounge/${slug}/about`}
                                      className={({ isActive }) =>
                                        [
                                          "desktop-nav__subsublink",
                                          isActive ? "desktop-nav__subsublink--active" : "",
                                        ].join(" ")
                                      }
                                    >
                                      About
                                    </NavLink>
                                  </li>
                                </ul>
                              )}
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={label}
              to={to}
              className={({ isActive: navLinkActive }) => {
                const active = navLinkActive || isActive;
                return ["desktop-nav__link", active ? "desktop-nav__link--active" : ""]
                  .filter(Boolean)
                  .join(" ");
              }}
              aria-label={label}
              title={label}
            >
              <Icon className="desktop-nav__icon" />
              {!collapsed && <span className="desktop-nav__label">{label}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default DesktopNav;
