import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logoUrl from "../../../public/astrolounge.svg";
import {
  CloudSun,
  Home,
  Settings,
  User,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LavaLampIcon from "../Icons/LavaLampIcons";
import { fetchLounges } from "../../lib/api";
import "./DesktopNav.css";

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
];

const slugFromName = (name: string) => encodeURIComponent(name);
const BRAND_NAME = "AstroLounge";

const DesktopNav: React.FC = () => {
  const location = useLocation();

  const [loungesOpen, setLoungesOpen] = useState<boolean>(
    location.pathname.startsWith("/lounge")
  );
  const [openLoungeId, setOpenLoungeId] = useState<string | null>(null);
  const [loungesList, setLoungesList] = useState<LoungeInfo[]>([]);

  // FIX: single source of truth for collapsed state (no top-level hook)
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

  return (
    <nav
      className={[
        "desktop-nav",
        collapsed ? "desktop-nav--collapsed" : "desktop-nav--expanded",
        "fixed left-4 md:left-8 2xl:left-[calc((100vw-1536px)/2+2rem)]",
      ].join(" ")}
      style={{
        width: collapsed ? "4.25rem" : "16rem",
        height: "92vh",
        transition: "width .25s ease",
        zIndex: 50, // ensure above Feed sticky header (z-30)
      }}
      aria-label="Primary"
    >
      <div className="desktop-nav__brand">
        <NavLink
          to="/"
          className="desktop-nav__brand-link"
          aria-label={`${BRAND_NAME} Home`}
          title={BRAND_NAME}
        >
          <img src={logoUrl} alt={BRAND_NAME} className="desktop-nav__brand-icon" />
          <span className="desktop-nav__brand-name">{BRAND_NAME}</span>
        </NavLink>

        <button
  type="button"
  className="desktop-nav__collapse-inline"
  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
  title={collapsed ? "Expand" : "Collapse"}
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCollapsed(p => !p); }}
>
  {collapsed ? <ChevronRight className="desktop-nav__collapse-icon" /> : <ChevronLeft className="desktop-nav__collapse-icon" />}
</button>

      </div>

      <div id="desktop-nav-scroll" className="desktop-nav__scroll">
        {navItems.map(({ label, to, icon: Icon, matchStartsWith }) => {
          const isActive = matchStartsWith
            ? location.pathname.startsWith(matchStartsWith)
            : location.pathname === to;

          if (label === "Lounges") {
            const groupActive = isActive;
            return (
              <div key="lounges-group" title="Lounges">
                <div
                  className={[
                    "desktop-nav__link",
                    groupActive ? "desktop-nav__link--active" : "",
                    "desktop-nav__group",
                  ].join(" ")}
                >
                  <Icon className="desktop-nav__icon" />
                  <NavLink
                    to="/lounge"
                    className="desktop-nav__label desktop-nav__group-label"
                    aria-label="Lounges"
                    title="Lounges"
                  >
                    Lounges
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
                                  aria-label={l.name}
                                  title={l.name}
                                >
                                  <span className="desktop-nav__dot" aria-hidden="true" />
                                  {l.name}
                                </NavLink>

                                <button
                                  type="button"
                                  className="desktop-nav__mini-toggle"
                                  aria-label={`Toggle ${l.name} sub categories`}
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
              <span className="desktop-nav__label">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default DesktopNav;
