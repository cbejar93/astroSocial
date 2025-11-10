// src/pages/SettingsPage.tsx
import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  Moon,
  Minimize2,
  LayoutList,
  Palette,
  Languages,
  FileText,
  BookText,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

/* ----------------------- Accent (brand) palette ------------------------ */

type AccentKey = "brand" | "ocean" | "mint";
const ACCENTS: Record<AccentKey, { from: string; to: string }> = {
  brand: { from: "#f04bb3", to: "#5aa2ff" },
  ocean: { from: "#06b6d4", to: "#8b5cf6" },
  mint: { from: "#22c55e", to: "#06b6d4" },
};

/* --------------------------- UI Primitives ----------------------------- */
/** Uses the same frosted/blur gradient style as PostCard */
const AuroraBorder: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <div
    className={[
      "relative overflow-hidden rounded-lg",
      "border border-white/10",
      "bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/20",
      "backdrop-blur-xl text-slate-100",
      "shadow-[0_16px_36px_rgba(2,6,23,0.35)]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const Card: React.FC<
  React.PropsWithChildren<{ title: string; desc?: string; className?: string }>
> = ({ title, desc, className = "", children }) => (
  <AuroraBorder className={className}>
    <div className="px-5 py-4 border-b border-white/10">
      <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
      {desc && <p className="mt-1 text-xs text-gray-300">{desc}</p>}
    </div>
    <div className="p-5">{children}</div>
  </AuroraBorder>
);

const Row: React.FC<
  React.PropsWithChildren<{ label: string; hint?: string; icon?: React.ReactNode }>
> = ({ label, hint, icon, children }) => (
  <div className="py-2">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        {icon && <span className="mt-0.5 text-gray-300">{icon}</span>}
        <div>
          <div className="text-[13px] text-gray-100">{label}</div>
          {hint && <div className="text-[11px] text-gray-300 mt-0.5">{hint}</div>}
        </div>
      </div>
      <div className="sm:min-w-[16rem]">{children}</div>
    </div>
  </div>
);

const Switch: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; accent?: AccentKey }
> = ({ label, id, className = "", accent = "brand", ...props }) => {
  const autoId = useId();
  const switchId = id ?? autoId;
  const grad = ACCENTS[accent];

  return (
    <div className="inline-flex items-center gap-3">
      <label
        htmlFor={switchId}
        className={[
          "relative h-6 w-11 select-none cursor-pointer block",
          "rounded-full ring-1 ring-white/10",
          "bg-gray-700 transition-colors",
          className,
        ].join(" ")}
        style={{
          backgroundImage: `linear-gradient(90deg, ${grad.from}, ${grad.to})`,
        }}
      >
        <input id={switchId} type="checkbox" className="sr-only peer" {...props} />
        <span className="absolute inset-0 rounded-full bg-gray-700 peer-checked:bg-transparent transition-colors" />
        <span
          className={[
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white",
            "shadow ring-1 ring-black/5",
            "transition-transform peer-checked:translate-x-5",
          ].join(" ")}
        />
        <span className="sr-only">{label ?? "toggle"}</span>
      </label>
      {label && <span className="text-sm text-gray-100">{label}</span>}
    </div>
  );
};

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className="relative">
    <select
      {...props}
      className={[
        "w-full appearance-none rounded-lg bg-gray-900/40 border border-white/10",
        "text-gray-100 placeholder-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-sky-500",
        "px-3 py-2 text-sm pr-9",
        className,
      ].join(" ")}
    >
      {children}
    </select>
    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
      ▾
    </span>
  </div>
);

const TileLink: React.FC<
  React.PropsWithChildren<{ to?: string; href?: string; icon: React.ReactNode }>
> = ({ to, href, icon, children }) => {
  const Inner = (
    <div className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition">
      <div className="flex items-center gap-3">
        <span className="text-gray-300">{icon}</span>
        <span>{children}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
    </div>
  );
  if (to) return <Link to={to}>{Inner}</Link>;
  if (href) return <a href={href}>{Inner}</a>;
  return Inner;
};

/* ------------------------------- Page ---------------------------------- */

const SettingsPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [compactUI, setCompactUI] = useState(false);
  const [accent, setAccent] = useState<AccentKey>("brand");

  const grad = ACCENTS[accent];

  return (
    <div className="w-full">
      {/* Center horizontally (uplift kept) */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-2 pb-8">
        <div className="text-gray-200 space-y-6">
          {/* Header (now frosted like PostCard) */}
          <AuroraBorder>
            <div className="px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold">Settings</h1>
                  <p className="text-xs text-gray-300 mt-1">Tune the vibe to your liking.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDarkMode(true);
                    setReduceMotion(false);
                    setCompactUI(false);
                    setAccent("brand");
                  }}
                  className="text-xs rounded-md px-3 py-1.5 bg-white/10 hover:bg-white/20 ring-1 ring-white/10"
                >
                  Reset
                </button>
              </div>

              {/* Live preview chip */}
              <div className="mt-4 flex items-center gap-3">
                <div
                  className="h-7 rounded-full px-3 text-xs font-medium inline-flex items-center ring-1 ring-white/10"
                  style={{ background: `linear-gradient(90deg, ${grad.from}, ${grad.to})` }}
                >
                  Current accent
                </div>
                <div className="text-[11px] text-gray-300">
                  Preview applies to controls below
                </div>
              </div>
            </div>
          </AuroraBorder>

          {/* Preferences */}
          <Card title="Preferences" desc="Customize the look and feel.">
            <div className="space-y-1.5">
              <Row label="Dark mode" hint="Use a dark color theme." icon={<Moon className="w-4 h-4" />}>
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.currentTarget.checked)}
                  aria-label="Enable dark mode"
                  accent={accent}
                />
              </Row>

              <Row
                label="Reduce motion"
                hint="Limit animations and transitions."
                icon={<Minimize2 className="w-4 h-4" />}
              >
                <Switch
                  checked={reduceMotion}
                  onChange={(e) => setReduceMotion(e.currentTarget.checked)}
                  aria-label="Reduce motion"
                  accent={accent}
                />
              </Row>

              <Row
                label="Compact UI"
                hint="Tighten spacing across components."
                icon={<LayoutList className="w-4 h-4" />}
              >
                <Switch
                  checked={compactUI}
                  onChange={(e) => setCompactUI(e.currentTarget.checked)}
                  aria-label="Enable compact UI"
                  accent={accent}
                />
              </Row>

              <Row
                label="Accent color"
                hint="Affects highlights and switches."
                icon={<Palette className="w-4 h-4" />}
              >
                <div className="flex items-center gap-2">
                  {(Object.keys(ACCENTS) as AccentKey[]).map((key) => {
                    const a = ACCENTS[key];
                    const active = accent === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAccent(key)}
                        className={[
                          "h-7 w-7 rounded-full ring-2 transition",
                          active ? "ring-white" : "ring-white/10 hover:ring-white/30",
                        ].join(" ")}
                        style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                        aria-label={`Use ${key} accent`}
                        title={key}
                      />
                    );
                  })}
                </div>
              </Row>
            </div>
          </Card>

          {/* Language */}
          <Card title="Language" desc="Set your preferred display language.">
            <Row label="Display language" icon={<Languages className="w-4 h-4" />}>
              <Select defaultValue="en" aria-label="Display language">
                <option value="en">English</option>
                <option value="am">Amharic</option>
                <option value="fr">French</option>
              </Select>
            </Row>
          </Card>

          {/* Support & About */}
          <Card title="Support & About">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TileLink to="/settings/privacy" icon={<FileText className="w-4 h-4" />}>
                Privacy Policy
              </TileLink>
              <TileLink to="/settings/terms" icon={<BookText className="w-4 h-4" />}>
                Terms of Service
              </TileLink>
              <TileLink to="/settings/community-guidelines" icon={<FileText className="w-4 h-4" />}>
                Community Guidelines
              </TileLink>
              <TileLink href="mailto:support@example.com" icon={<HelpCircle className="w-4 h-4" />}>
                Contact Support
              </TileLink>
            </div>
            <p className="mt-3 text-[11px] text-gray-300">
              Legal pages open in a modal so you don’t lose your place.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
