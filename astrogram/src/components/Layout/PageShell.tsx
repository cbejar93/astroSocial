import type { ReactNode } from "react";
import DesktopNav from "../Sidebar/DesktopNav";

interface PageShellProps {
  children: ReactNode;
}

const PageShell = ({ children }: PageShellProps) => (
  <main className="flex-1">
    <div className="w-full px-6 lg:px-8 pt-[calc(var(--app-header-height)+0.75rem)] sm:pt-[calc(var(--app-header-height)+1.25rem)] pb-20 md:pl-[var(--desktop-nav-offset)] md:grid md:grid-cols-[var(--desktop-nav-current-width)_minmax(0,1fr)] md:gap-8">
      <aside
        className="hidden md:flex md:w-[var(--desktop-nav-current-width)] md:flex-col"
        aria-label="Primary navigation"
      >
        <DesktopNav />
      </aside>

      <section className="w-full min-w-0">{children}</section>
    </div>
  </main>
);

export default PageShell;
